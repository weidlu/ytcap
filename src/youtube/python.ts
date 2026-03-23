import { execFile as execFileCallback } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

import { cleanTranscriptText } from "./normalize.js";
import type {
  TranscriptFetchResult,
  TranscriptSegment,
  YoutubeMetadata
} from "./types.js";

const execFile = promisify(execFileCallback);
const MAX_BUFFER = 16 * 1024 * 1024;

interface CommandResult {
  stderr: string;
  stdout: string;
}

export interface DoctorResult {
  configured: boolean;
  missing: string[];
  pythonCommand: string;
  ytDlpVersion: string | null;
  youtubeTranscriptApiVersion: string | null;
}

export async function youtubeDoctor(pythonBin: string): Promise<DoctorResult> {
  const missing: string[] = [];
  let ytDlpVersion: string | null = null;
  let youtubeTranscriptApiVersion: string | null = null;

  try {
    ytDlpVersion = (await runPythonModule(pythonBin, "yt_dlp", ["--version"])).stdout.trim();
  } catch {
    missing.push("yt-dlp");
  }

  try {
    youtubeTranscriptApiVersion = (
      await runPythonModule(pythonBin, "youtube_transcript_api", ["--version"])
    ).stdout.trim();
  } catch {
    missing.push("youtube-transcript-api");
  }

  return {
    configured: missing.length === 0,
    missing,
    pythonCommand: pythonBin,
    ytDlpVersion,
    youtubeTranscriptApiVersion
  };
}

export async function fetchMetadataFromYtDlp(
  pythonBin: string,
  url: string
): Promise<YoutubeMetadata> {
  const command = await runPythonModule(pythonBin, "yt_dlp", [
    "--skip-download",
    "--dump-single-json",
    "--no-warnings",
    url
  ]);
  const payload = JSON.parse(command.stdout) as Record<string, unknown> | null;

  if (!payload || typeof payload !== "object") {
    throw new Error("yt-dlp returned invalid metadata.");
  }

  const id = String(payload.id ?? "");
  if (!id) {
    throw new Error("yt-dlp metadata did not include a video id.");
  }

  return {
    id,
    title: String(payload.title ?? id),
    channel: String(
      payload.channel ?? payload.uploader ?? payload.uploader_id ?? "Unknown Channel"
    ),
    webpageUrl: String(payload.webpage_url ?? url),
    durationSeconds:
      typeof payload.duration === "number" ? payload.duration : undefined
  };
}

export async function fetchTranscriptFromYtDlp(args: {
  languages: string[];
  outputDir: string;
  pythonBin: string;
  url: string;
  videoId: string;
}): Promise<TranscriptFetchResult | null> {
  try {
    await runPythonModule(args.pythonBin, "yt_dlp", [
      "--skip-download",
      "--no-warnings",
      "--write-subs",
      "--write-auto-subs",
      "--sub-format",
      "vtt",
      "--sub-langs",
      args.languages.join(","),
      "--output",
      `${args.outputDir}/%(id)s.%(ext)s`,
      args.url
    ]);
  } catch {
    return null;
  }

  const files = await readdir(args.outputDir);
  const subtitleFile = chooseSubtitleFile(files, args.videoId, args.languages);
  if (!subtitleFile) {
    return null;
  }

  const content = await readFile(join(args.outputDir, subtitleFile), "utf8");
  const segments = parseVtt(content);
  if (segments.length === 0) {
    return null;
  }

  return {
    source: "yt-dlp",
    language: inferLanguageFromFilename(subtitleFile, args.languages),
    segments
  };
}

export async function fetchTranscriptFromApi(args: {
  languages: string[];
  pythonBin: string;
  videoId: string;
}): Promise<TranscriptFetchResult | null> {
  try {
    const command = await runPythonModule(args.pythonBin, "youtube_transcript_api", [
      "--format",
      "json",
      "--languages",
      ...args.languages,
      args.videoId
    ]);

    const payload = JSON.parse(command.stdout) as Array<Record<string, unknown>>;
    const segments = payload
      .map((item) => {
        const text = cleanTranscriptText(String(item.text ?? ""));
        if (!text) {
          return null;
        }

        return {
          start: toNumber(item.start),
          duration: toNumber(item.duration),
          text
        } satisfies TranscriptSegment;
      })
      .filter((value): value is TranscriptSegment => value !== null);

    if (segments.length === 0) {
      return null;
    }

    return {
      source: "youtube-transcript-api",
      language: String(payload[0]?.lang ?? payload[0]?.language ?? args.languages[0] ?? "en"),
      segments
    };
  } catch {
    return null;
  }
}

async function runPythonModule(
  pythonBin: string,
  moduleName: string,
  args: string[]
): Promise<CommandResult> {
  const result = await execFile(pythonBin, ["-m", moduleName, ...args], {
    maxBuffer: MAX_BUFFER,
    windowsHide: true
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function chooseSubtitleFile(
  files: string[],
  videoId: string,
  languages: string[]
): string | null {
  const candidates = files.filter((file) => file.startsWith(videoId) && extname(file) === ".vtt");
  if (candidates.length === 0) {
    return null;
  }

  for (const language of languages) {
    const exact = candidates.find((file) => basename(file).includes(`.${language}.`));
    if (exact) {
      return exact;
    }
  }

  return candidates.sort()[0] ?? null;
}

function inferLanguageFromFilename(file: string, languages: string[]): string {
  for (const language of languages) {
    if (basename(file).includes(`.${language}.`)) {
      return language;
    }
  }

  const match = file.match(/\.([A-Za-z-]+)\.vtt$/);
  return match?.[1] ?? languages[0] ?? "en";
}

function parseVtt(content: string): TranscriptSegment[] {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean);

  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timeIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeIndex === -1) {
      continue;
    }

    const [startRaw, endRaw] = (lines[timeIndex] ?? "").split("-->").map((part) => part.trim());
    const start = parseTimestamp(startRaw ?? "");
    const end = parseTimestamp((endRaw ?? "").split(" ")[0] ?? "");
    const text = cleanTranscriptText(lines.slice(timeIndex + 1).join(" "));

    if (!Number.isFinite(start) || !Number.isFinite(end) || !text) {
      continue;
    }

    segments.push({
      start,
      duration: Math.max(0, end - start),
      text
    });
  }

  return segments;
}

function parseTimestamp(value: string): number {
  const match = value.match(/^(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) {
    return Number.NaN;
  }

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const seconds = Number.parseInt(match[3] ?? "0", 10);
  const milliseconds = Number.parseInt(match[4] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
