import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXAMPLES_DIR = path.join(ROOT, "examples");
const OUT_DIR = path.join(ROOT, "docs", "examples");

const EXAMPLE_DIR_RE = /^\d{2}-/;

async function cleanDocsExamples(): Promise<void> {
  let names: string[];
  try {
    names = await fs.readdir(OUT_DIR);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
    throw e;
  }
  await Promise.all(
    names
      .filter((n) => n.endsWith(".md"))
      .map((n) => fs.unlink(path.join(OUT_DIR, n))),
  );
}

async function collectTsFiles(dir: string, base: string): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: string[] = [];
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      out.push(...(await collectTsFiles(abs, base)));
    } else if (e.isFile() && e.name.endsWith(".ts")) {
      out.push(abs);
    }
  }
  return out;
}

function relFromExample(exampleDir: string, file: string): string {
  return path.relative(exampleDir, file).split(path.sep).join("/");
}

async function writeExamplePage(exampleName: string, examplePath: string): Promise<void> {
  const readmePath = path.join(examplePath, "README.md");
  const readme = await fs.readFile(readmePath, "utf8");

  const tsFiles = await collectTsFiles(path.join(examplePath, "src"), examplePath);
  const parts: string[] = [readme.trimEnd()];

  if (tsFiles.length > 0) {
    parts.push("", "## Source", "");
    for (const abs of tsFiles) {
      const rel = relFromExample(examplePath, abs);
      let body = await fs.readFile(abs, "utf8");
      if (body.startsWith("#!/usr/bin/env bun\n")) {
        body = body.slice("#!/usr/bin/env bun\n".length);
      } else if (body.startsWith("#!/usr/bin/env node\n")) {
        body = body.slice("#!/usr/bin/env node\n".length);
      }
      parts.push(`### \`${rel}\``, "", "```typescript", body.trimEnd(), "```", "");
    }
  }

  const outPath = path.join(OUT_DIR, `${exampleName}.md`);
  await fs.writeFile(outPath, `${parts.join("\n").trim()}\n`, "utf8");
}

async function writeIndex(): Promise<void> {
  const indexSrc = path.join(EXAMPLES_DIR, "README.md");
  let body = await fs.readFile(indexSrc, "utf8");
  body = body.replace(/\]\((\d{2}-[^/]+)\/README\.md\)/g, "](./$1.md)");
  await fs.writeFile(path.join(OUT_DIR, "index.md"), body, "utf8");
}

async function main(): Promise<void> {
  await cleanDocsExamples();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const entries = await fs.readdir(EXAMPLES_DIR, { withFileTypes: true });
  const exampleDirs = entries
    .filter((e) => e.isDirectory() && EXAMPLE_DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort();

  if (exampleDirs.length === 0) {
    console.warn("No enumerated example dirs (expected names like 01-foo under examples/).");
  }

  for (const name of exampleDirs) {
    await writeExamplePage(name, path.join(EXAMPLES_DIR, name));
    console.log(`Wrote docs/examples/${name}.md`);
  }

  await writeIndex();
  console.log("Wrote docs/examples/index.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
