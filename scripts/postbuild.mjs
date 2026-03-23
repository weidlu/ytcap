import { readFile, writeFile } from "node:fs/promises";

const entryFile = new URL("../dist/src/index.js", import.meta.url);
const content = await readFile(entryFile, "utf8");

if (!content.startsWith("#!/usr/bin/env node\n")) {
  await writeFile(entryFile, `#!/usr/bin/env node\n${content}`, "utf8");
}
