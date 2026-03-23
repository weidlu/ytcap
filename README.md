# ytcap

CLI for fetching YouTube video metadata and transcripts.

## Install

```bash
npm install
python3 -m pip install --user yt-dlp youtube-transcript-api
npm run build
```

On Windows, use `py` instead of `python3` if needed:

```powershell
npm install
py -m pip install --user yt-dlp youtube-transcript-api
npm run build
```

## Usage

Check local runtime:

```bash
node dist/src/index.js doctor --format json
```

Fetch a video's metadata and transcript:

```bash
node dist/src/index.js fetch --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --lang en --format json
```

The command writes output under `youtube-output/<video-id>/`:

- `metadata.json`
- `transcript.json`
- `transcript.txt`

## Proxy

If your machine reaches YouTube through a local proxy, set standard proxy environment variables before running the CLI:

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
```

PowerShell:

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'
$env:HTTPS_PROXY='http://127.0.0.1:7890'
```

## Commands

```text
ytcap doctor [--format json|table|yaml]
ytcap fetch --url <youtube-url> [--lang <language>] [--output <directory>] [--format json|table|yaml]
```
