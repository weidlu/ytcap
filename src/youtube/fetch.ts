import { join } from "node:path";

import {
  buildLanguagePreference,
  extractVideoId,
  transcriptTextFromSegments
} from "./normalize.js";
import type {
  TranscriptFetchResult,
  YoutubeFetchResult,
  YoutubeMetadata
} from "./types.js";

export interface YoutubeFetchArgs {
  lang?: string;
  outputRoot?: string;
  url: string;
}

export interface YoutubeFetchDependencies {
  fetchMetadata: (url: string) => Promise<YoutubeMetadata>;
  fetchTranscriptFromApi: (args: {
    languages: string[];
    videoId: string;
  }) => Promise<TranscriptFetchResult | null>;
  fetchTranscriptFromYtDlp: (args: {
    languages: string[];
    outputDir: string;
    url: string;
    videoId: string;
  }) => Promise<TranscriptFetchResult | null>;
  mkdir: (path: string, options: { recursive: true }) => Promise<void>;
  writeFile: (path: string, content: string) => Promise<void>;
}

export async function fetchYoutubeArtifacts(
  args: YoutubeFetchArgs,
  deps: YoutubeFetchDependencies
): Promise<YoutubeFetchResult> {
  const videoId = extractVideoId(args.url);
  const metadata = await deps.fetchMetadata(args.url);
  const languages = buildLanguagePreference(args.lang);
  const outputDir = join(args.outputRoot ?? "youtube-output", videoId);

  await deps.mkdir(outputDir, { recursive: true });

  const transcript =
    (await deps.fetchTranscriptFromYtDlp({
      outputDir,
      url: args.url,
      videoId,
      languages
    })) ??
    (await deps.fetchTranscriptFromApi({
      videoId,
      languages
    }));

  if (!transcript) {
    throw new Error("No subtitles available from yt-dlp or youtube-transcript-api.");
  }

  const transcriptText = transcriptTextFromSegments(transcript.segments);
  const metadataPath = join(outputDir, "metadata.json");
  const transcriptJsonPath = join(outputDir, "transcript.json");
  const transcriptTextPath = join(outputDir, "transcript.txt");

  await deps.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  await deps.writeFile(
    transcriptJsonPath,
    `${JSON.stringify(
      {
        videoId,
        title: metadata.title,
        language: transcript.language,
        source: transcript.source,
        segments: transcript.segments
      },
      null,
      2
    )}\n`
  );
  await deps.writeFile(transcriptTextPath, `${transcriptText}\n`);

  return {
    videoId,
    title: metadata.title,
    channel: metadata.channel,
    language: transcript.language,
    transcriptSource: transcript.source,
    transcriptText,
    outputDir,
    metadataPath,
    transcriptJsonPath,
    transcriptTextPath
  };
}
