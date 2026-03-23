export type OutputFormat = "json" | "table" | "yaml";

export function formatOutput(value: unknown, format: OutputFormat): string {
  if (format === "json") {
    return `${JSON.stringify(value, null, 2)}\n`;
  }

  if (format === "yaml") {
    return `${toYaml(value)}\n`;
  }

  return `${toTable(value)}\n`;
}

function toYaml(value: unknown, indent = 0): string {
  const prefix = "  ".repeat(indent);

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return `${prefix}- ${toYaml(item, indent + 1).trimStart()}`;
        }

        return `${prefix}- ${String(item)}`;
      })
      .join("\n");
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => {
        if (typeof nested === "object" && nested !== null) {
          return `${prefix}${key}:\n${toYaml(nested, indent + 1)}`;
        }

        return `${prefix}${key}: ${String(nested)}`;
      })
      .join("\n");
  }

  return `${prefix}${String(value)}`;
}

function toTable(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "(empty)";
    }

    const rows = value as Array<Record<string, unknown>>;
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    return renderRows(headers, rows);
  }

  if (typeof value === "object" && value !== null) {
    const objectValue = value as Record<string, unknown>;
    return renderRows(
      ["key", "value"],
      Object.entries(objectValue).map(([key, nested]) => ({
        key,
        value:
          typeof nested === "object" && nested !== null
            ? JSON.stringify(nested)
            : String(nested)
      }))
    );
  }

  return String(value);
}

function renderRows(headers: string[], rows: Array<Record<string, unknown>>): string {
  const widths = headers.map((header) =>
    Math.max(header.length, ...rows.map((row) => String(row[header] ?? "").length))
  );

  const line = (cells: string[]) =>
    cells.map((cell, index) => cell.padEnd(widths[index] ?? cell.length)).join(" | ");

  return [
    line(headers),
    widths.map((width) => "-".repeat(width)).join("-|-"),
    ...rows.map((row) => line(headers.map((header) => String(row[header] ?? ""))))
  ].join("\n");
}
