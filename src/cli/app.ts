import type { Writable } from "node:stream";

import { formatOutput, type OutputFormat } from "./format.js";

interface CliDependencies {
  handlers: {
    doctor: () => Promise<unknown>;
    fetch: (args: { lang?: string; output?: string; url: string }) => Promise<unknown>;
  };
  stderr: Pick<Writable, "write">;
  stdout: Pick<Writable, "write">;
}

export async function runCli(
  argv: string[],
  deps: CliDependencies
): Promise<number> {
  try {
    const [command, ...rest] = argv;
    const flags = parseFlags(rest);
    const format = parseFormat(flags.format);

    if (!command || command === "help" || command === "--help") {
      deps.stdout.write(helpText());
      return 0;
    }

    if (command === "doctor") {
      deps.stdout.write(formatOutput(await deps.handlers.doctor(), format));
      return 0;
    }

    if (command === "fetch") {
      const url = requireFlag(flags, "url");
      deps.stdout.write(
        formatOutput(
          await deps.handlers.fetch({
            url,
            lang: valueFlag(flags, "lang"),
            output: valueFlag(flags, "output")
          }),
          format
        )
      );
      return 0;
    }

    deps.stderr.write(`Unknown command: ${command}\n`);
    deps.stderr.write(helpText());
    return 1;
  } catch (error) {
    deps.stderr.write(`${formatError(error)}\n`);
    return 1;
  }
}

function helpText(): string {
  return [
    "Usage:",
    "  ytcap doctor [--format json|table|yaml]",
    "  ytcap fetch --url <youtube-url> [--lang <language>] [--output <directory>] [--format json|table|yaml]"
  ].join("\n").concat("\n");
}

function parseFlags(argv: string[]): Record<string, string> {
  const flags: Record<string, string> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      flags[key] = "true";
      continue;
    }

    flags[key] = value;
    index += 1;
  }

  return flags;
}

function requireFlag(flags: Record<string, string>, key: string): string {
  const value = flags[key];
  if (!value || value === "true") {
    throw new Error(`Missing required flag: --${key}`);
  }

  return value;
}

function valueFlag(flags: Record<string, string>, key: string): string | undefined {
  const value = flags[key];
  if (!value || value === "true") {
    return undefined;
  }

  return value;
}

function parseFormat(value: string | undefined): OutputFormat {
  if (value === "json" || value === "table" || value === "yaml") {
    return value;
  }

  return "table";
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
