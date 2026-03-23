import type { TranscriptSegment } from "./types.js";

export function extractVideoId(input: string): string {
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
    return input;
  }

  const url = new URL(input);
  if (url.hostname === "youtu.be") {
    const candidate = url.pathname.split("/").filter(Boolean)[0];
    if (candidate) {
      return candidate;
    }
  }

  const direct = url.searchParams.get("v");
  if (direct) {
    return direct;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "shorts" && parts[1]) {
    return parts[1];
  }

  throw new Error(`Unsupported YouTube URL: ${input}`);
}

export function buildLanguagePreference(language?: string): string[] {
  const values = new Set<string>();

  if (language) {
    values.add(language);
    const base = language.replace("_", "-").split("-")[0];
    if (base) {
      values.add(base);
    }
  }

  values.add("en");
  return [...values];
}

export function cleanTranscriptText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function transcriptTextFromSegments(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => cleanTranscriptText(segment.text))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
