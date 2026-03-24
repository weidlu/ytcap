# ytcap

CLI for fetching YouTube video metadata and transcripts.

## Requirements

- Node.js
- Python 3
- Python packages: `yt-dlp`, `youtube-transcript-api`

## Install

```bash
npm install
python3 -m pip install --user yt-dlp youtube-transcript-api
npm run build
```

On Windows, the default Python launcher is `py`:

```powershell
npm install
py -m pip install --user yt-dlp youtube-transcript-api
npm run build
```

Global install from npm:

```bash
npm install -g @illidian/ytcap --registry https://registry.npmjs.org/
```

## Usage

Show available commands:

```bash
node dist/src/index.js --help
```

Check local runtime:

```bash
node dist/src/index.js doctor --format json
```

Fetch a video's metadata and transcript:

```bash
node dist/src/index.js fetch --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --lang en --format json
```

`fetch` first tries subtitles from `yt-dlp`, then falls back to `youtube-transcript-api`.

By default, output is written to `youtube-output/<video-id>/`:

- `metadata.json`
- `transcript.json`
- `transcript.txt`

You can override the output root with `--output <directory>` or `YTCAP_OUTPUT_DIR`.

## Environment Variables

- `PYTHON_BIN`: overrides the Python command used by `doctor` and `fetch`
- `YTCAP_OUTPUT_DIR`: sets the default output directory for `fetch`

Defaults:

- Windows: `PYTHON_BIN=py`
- macOS / Linux: `PYTHON_BIN=python3`
- `YTCAP_OUTPUT_DIR=youtube-output`

## Commands

```text
ytcap doctor [--format json|table|yaml]
ytcap fetch --url <youtube-url> [--lang <language>] [--output <directory>] [--format json|table|yaml]
```

`--format` defaults to `table`.
