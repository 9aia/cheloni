import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src/std"];
const OUTPUT_FILE = "CONCAT.md";
const IGNORED_DIRS = new Set(["docs/.vitepress/dist", "docs/.vitepress/cache"]);

function languageFromFilePath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".ts":
      return "ts";
    case ".tsx":
      return "tsx";
    case ".js":
      return "js";
    case ".jsx":
      return "jsx";
    case ".json":
      return "json";
    case ".md":
      return "md";
    case ".yml":
    case ".yaml":
      return "yaml";
    default:
      return "text";
  }
}

async function collectFilesRecursive(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(dirPath, entry.name);
    const relativePath = path.relative(ROOT, absolutePath).replaceAll(path.sep, "/");

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(relativePath)) {
        continue;
      }
      files.push(...(await collectFilesRecursive(absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

async function main() {
  const existingDirs: string[] = [];

  for (const dir of TARGET_DIRS) {
    const fullPath = path.join(ROOT, dir);
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) existingDirs.push(fullPath);
    } catch {
      // Directory does not exist; skip it.
    }
  }

  if (existingDirs.length === 0) {
    throw new Error("Neither src/ nor docs/ exist in this repository.");
  }

  const files = (await Promise.all(existingDirs.map((dir) => collectFilesRecursive(dir))))
    .flat()
    .sort((a, b) => a.localeCompare(b));

  const sections: string[] = [
    "# CONCAT",
    "",
    `Generated from: ${TARGET_DIRS.map((d) => `\`${d}/\``).join(", ")}`,
    "",
  ];

  for (const file of files) {
    const relativePath = path.relative(ROOT, file).replaceAll(path.sep, "/");
    const content = await fs.readFile(file, "utf8");
    const lang = languageFromFilePath(relativePath);

    sections.push(`## ${relativePath}`);
    sections.push("");
    sections.push(`\`\`\`${lang}`);
    sections.push(content);
    sections.push("```");
    sections.push("");
  }

  await fs.writeFile(path.join(ROOT, OUTPUT_FILE), sections.join("\n"), "utf8");
  console.log(`Wrote ${OUTPUT_FILE} with ${files.length} files.`);
}

await main();
