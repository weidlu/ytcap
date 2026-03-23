export interface AppConfig {
  pythonBin: string;
  youtubeOutputDir: string;
}

const DEFAULT_PYTHON_BIN = process.platform === "win32" ? "py" : "python3";
const DEFAULT_YOUTUBE_OUTPUT_DIR = "youtube-output";

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    pythonBin: env.PYTHON_BIN ?? DEFAULT_PYTHON_BIN,
    youtubeOutputDir: env.YTCAP_OUTPUT_DIR ?? DEFAULT_YOUTUBE_OUTPUT_DIR
  };
}
