#!/usr/bin/env bun

/**
 * Fixes path aliases in generated .d.ts files
 * Converts ~/... imports to relative paths
 */

import { readdir, stat } from "fs/promises";
import path from "path";

async function findDtsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        files.push(...await findDtsFiles(fullPath));
      } else if (entry.endsWith(".d.ts")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist, ignore
  }
  return files;
}

async function fixDtsPaths() {
  console.log("🔧 Fixing path aliases in .d.ts files...\n");

  // Find all .d.ts files in dist
  const dtsFiles = await findDtsFiles("dist");

  let fixedCount = 0;

  for (const filePath of dtsFiles) {
    const content = await Bun.file(filePath).text();
    const dir = path.dirname(filePath);
    
    // Calculate relative path from dist to src
    // dist/core/definition/command/index.d.ts -> src/core/definition/command
    // We need to go from dist/... to src/...
    const distToSrc = path.relative(dir, "src");
    
    let modified = content;
    let hasChanges = false;

    // Replace ~/core/... with relative paths within dist/
    modified = modified.replace(
      /from\s+["']~\/core\/([^"']+)["']/g,
      (match, importPath) => {
        hasChanges = true;
        // Calculate relative path: from current file's directory to dist/core/importPath
        // dist/core/definition/command/index.d.ts -> dist/core/creation/command
        const targetPath = path.join("dist", "core", importPath);
        const relativePath = path.relative(dir, targetPath);
        // Ensure it starts with ./ or ../
        const normalizedPath = relativePath.startsWith(".") 
          ? relativePath 
          : `./${relativePath}`;
        return `from "${normalizedPath}"`;
      }
    );

    // Replace ~/lib/... with relative paths within dist/
    modified = modified.replace(
      /from\s+["']~\/lib\/([^"']+)["']/g,
      (match, importPath) => {
        hasChanges = true;
        // Calculate relative path: from current file's directory to dist/lib/importPath
        const targetPath = path.join("dist", "lib", importPath);
        const relativePath = path.relative(dir, targetPath);
        // Ensure it starts with ./ or ../
        const normalizedPath = relativePath.startsWith(".") 
          ? relativePath 
          : `./${relativePath}`;
        return `from "${normalizedPath}"`;
      }
    );

    // Replace ~/plugins/... with relative paths within dist/
    modified = modified.replace(
      /from\s+["']~\/plugins\/([^"']+)["']/g,
      (match, importPath) => {
        hasChanges = true;
        // Calculate relative path: from current file's directory to dist/plugins/importPath
        const targetPath = path.join("dist", "plugins", importPath);
        const relativePath = path.relative(dir, targetPath);
        // Ensure it starts with ./ or ../
        const normalizedPath = relativePath.startsWith(".") 
          ? relativePath 
          : `./${relativePath}`;
        return `from "${normalizedPath}"`;
      }
    );

    // Replace any other ~/... imports
    modified = modified.replace(
      /from\s+["']~\/([^"']+)["']/g,
      (match, importPath) => {
        hasChanges = true;
        // Calculate relative path: from current file's directory to dist/importPath
        const targetPath = path.join("dist", importPath);
        const relativePath = path.relative(dir, targetPath);
        // Ensure it starts with ./ or ../
        const normalizedPath = relativePath.startsWith(".") 
          ? relativePath 
          : `./${relativePath}`;
        return `from "${normalizedPath}"`;
      }
    );

    if (hasChanges) {
      await Bun.write(filePath, modified);
      fixedCount++;
      console.log(`  ✓ Fixed ${filePath}`);
    }
  }

  console.log(`\n✅ Fixed path aliases in ${fixedCount} file(s)`);
}

fixDtsPaths().catch((error) => {
  console.error("❌ Failed to fix path aliases:", error);
  process.exit(1);
});
