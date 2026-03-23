import { describe, expect, it } from "vitest";

import {
  buildLanguagePreference,
  extractVideoId,
  transcriptTextFromSegments
} from "../../src/youtube/normalize.js";

describe("normalize helpers", () => {
  it("extracts the video id from watch URLs", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts the video id from short URLs", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ?t=1")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("builds language preference with base and english fallback", () => {
    expect(buildLanguagePreference("zh-CN")).toEqual(["zh-CN", "zh", "en"]);
  });

  it("flattens transcript segments", () => {
    expect(
      transcriptTextFromSegments([
        { start: 0, duration: 1, text: "hello" },
        { start: 1, duration: 1, text: "world" }
      ])
    ).toBe("hello world");
  });
});
