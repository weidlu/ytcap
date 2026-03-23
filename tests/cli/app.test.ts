import { describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli/app.js";

describe("runCli", () => {
  it("prints ytcap-specific help text", async () => {
    const stdout: string[] = [];
    const result = await runCli(["--help"], {
      handlers: {
        doctor: vi.fn(),
        fetch: vi.fn()
      },
      stderr: { write: vi.fn() } as never,
      stdout: { write: (chunk: string) => stdout.push(chunk) } as never
    });

    expect(result).toBe(0);
    expect(stdout.join("")).toContain("ytcap doctor");
    expect(stdout.join("")).toContain("ytcap fetch");
  });

  it("runs doctor", async () => {
    const stdout: string[] = [];
    const result = await runCli(["doctor", "--format", "json"], {
      handlers: {
        doctor: vi.fn().mockResolvedValue({ configured: true }),
        fetch: vi.fn()
      },
      stderr: { write: vi.fn() } as never,
      stdout: { write: (chunk: string) => stdout.push(chunk) } as never
    });

    expect(result).toBe(0);
    expect(stdout.join("")).toContain("\"configured\": true");
  });

  it("runs fetch with required flags", async () => {
    const fetch = vi.fn().mockResolvedValue({
      transcriptSource: "yt-dlp",
      videoId: "abc123def45"
    });
    const stdout: string[] = [];
    const result = await runCli(
      [
        "fetch",
        "--url",
        "https://www.youtube.com/watch?v=abc123def45",
        "--lang",
        "zh-CN",
        "--output",
        "out",
        "--format",
        "json"
      ],
      {
        handlers: {
          doctor: vi.fn(),
          fetch
        },
        stderr: { write: vi.fn() } as never,
        stdout: { write: (chunk: string) => stdout.push(chunk) } as never
      }
    );

    expect(result).toBe(0);
    expect(fetch).toHaveBeenCalledWith({
      lang: "zh-CN",
      output: "out",
      url: "https://www.youtube.com/watch?v=abc123def45"
    });
    expect(stdout.join("")).toContain("\"transcriptSource\": \"yt-dlp\"");
  });
});
