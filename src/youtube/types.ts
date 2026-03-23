export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export type TranscriptSource = "yt-dlp" | "youtube-transcript-api";

export interface TranscriptFetchResult {
  source: TranscriptSource;
  language: string;
  segments: TranscriptSegment[];
}

export interface YoutubeMetadata {
  id: string;
  title: string;
  channel: string;
  webpageUrl: string;
  durationSeconds?: number;
}

export interface YoutubeFetchResult {
  channel: string;
  language: string;
  metadataPath: string;
  outputDir: string;
  title: string;
  transcriptJsonPath: string;
  transcriptSource: TranscriptSource;
  transcriptText: string;
  transcriptTextPath: string;
  videoId: string;
}
