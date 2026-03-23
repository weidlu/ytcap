#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { runCli } from "./cli/app.js";
import { readConfig } from "./config.js";
import { fetchYoutubeArtifacts } from "./youtube/fetch.js";
import {
  fetchMetadataFromYtDlp,
  fetchTranscriptFromApi,
  fetchTranscriptFromYtDlp,
  youtubeDoctor
} from "./youtube/python.js";

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const config = readConfig();

  return runCli(argv, {
    handlers: {
      doctor: () => youtubeDoctor(config.pythonBin),
      fetch: async (args) =>
        fetchYoutubeArtifacts(
          {
            url: args.url,
            lang: args.lang,
            outputRoot: resolve(args.output ?? config.youtubeOutputDir)
          },
          {
            fetchMetadata: (url) => fetchMetadataFromYtDlp(config.pythonBin, url),
            fetchTranscriptFromApi: ({ videoId, languages }) =>
              fetchTranscriptFromApi({
                videoId,
                languages,
                pythonBin: config.pythonBin
              }),
            fetchTranscriptFromYtDlp: ({ outputDir, url, videoId, languages }) =>
              fetchTranscriptFromYtDlp({
                outputDir,
                url,
                videoId,
                languages,
                pythonBin: config.pythonBin
              }),
            mkdir: async (path, options) => {
              await mkdir(path, options);
            },
            writeFile
          }
        )
    },
    stdout: process.stdout,
    stderr: process.stderr
  });
}

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  void main().then((code) => {
    process.exitCode = code;
  });
}
