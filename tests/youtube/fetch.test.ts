import { describe, expect, it, vi } from "vitest";

import { fetchYoutubeArtifacts } from "../../src/youtube/fetch.js";
import type {
  TranscriptFetchResult,
  YoutubeMetadata
} from "../../src/youtube/types.js";

function makeMetadata(): YoutubeMetadata {
  return {
    id: "dQw4w9WgXcQ",
    title: "Example Video",
    channel: "Example Channel",
    webpageUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  };
}

function makeTranscript(
  source: TranscriptFetchResult["source"]
): TranscriptFetchResult {
  return {
    source,
    language: "en",
    segments: [
      { start: 0, duration: 1, text: "Never" },
      { start: 1, duration: 1, text: "gonna" },
      { start: 2, duration: 1, text: "give you up" }
    ]
  };
}

describe("fetchYoutubeArtifacts", () => {
  it("prefers yt-dlp subtitles when available", async () => {
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const result = await fetchYoutubeArtifacts(
      {
        outputRoot: "out",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      },
      {
        fetchMetadata: vi.fn().mockResolvedValue(makeMetadata()),
        fetchTranscriptFromApi: vi.fn(),
        fetchTranscriptFromYtDlp: vi.fn().mockResolvedValue(makeTranscript("yt-dlp")),
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile
      }
    );

    expect(result.transcriptSource).toBe("yt-dlp");
    expect(result.transcriptText).toBe("Never gonna give you up");
    expect(writeFile).toHaveBeenCalledTimes(3);
  });

  it("falls back to youtube-transcript-api", async () => {
    const result = await fetchYoutubeArtifacts(
      {
        outputRoot: "out",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      },
      {
        fetchMetadata: vi.fn().mockResolvedValue(makeMetadata()),
        fetchTranscriptFromApi: vi
          .fn()
          .mockResolvedValue(makeTranscript("youtube-transcript-api")),
        fetchTranscriptFromYtDlp: vi.fn().mockResolvedValue(null),
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined)
      }
    );

    expect(result.transcriptSource).toBe("youtube-transcript-api");
  });
});
