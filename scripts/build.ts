#!/usr/bin/env bun

/**
 * Build script for Cheloni framework
 * 
 * Builds:
 * - Main entry: src/core/index.ts -> dist/index.js
 * - Plugins entry: src/plugins/index.ts -> dist/plugins/index.js
 * 
 * Generates TypeScript declaration files (.d.ts) in dist/
 */

async function build() {
  console.log("🔨 Building Cheloni framework...\n");

  // Build main entry point (cheloni -> src/core/index.ts)
  console.log("📦 Building main entry (src/core/index.ts -> dist/index.js)...");
  const mainBuild = await Bun.build({
    entrypoints: ["./src/core/index.ts"],
    outdir: "./dist",
    target: "node",
    format: "esm",
    minify: true,
    sourcemap: "external",
  });

  if (!mainBuild.success) {
    console.error("❌ Main build failed:");
    for (const log of mainBuild.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Build plugins entry point (cheloni/plugins -> src/plugins/index.ts)
  console.log("📦 Building plugins entry (src/plugins/index.ts -> dist/plugins/index.js)...");
  const pluginsBuild = await Bun.build({
    entrypoints: ["./src/plugins/index.ts"],
    outdir: "./dist/plugins",
    target: "node",
    format: "esm",
    minify: true,
    sourcemap: "external",
  });

  if (!pluginsBuild.success) {
    console.error("❌ Plugins build failed:");
    for (const log of pluginsBuild.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Generate TypeScript declaration files
  console.log("📝 Generating TypeScript declaration files...");
  const tscProcess = Bun.spawn({
    cmd: ["bunx", "tsc", "-p", "tsconfig.build.json"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const tscExitCode = await tscProcess.exited;
  if (tscExitCode !== 0) {
    console.error("❌ TypeScript declaration generation failed");
    process.exit(1);
  }

  // Move and fix declaration files
  console.log("🔧 Fixing declaration file paths...");
  
  // Move dist/core/index.d.ts to dist/index.d.ts
  try {
    const coreIndexDts = Bun.file("./dist/core/index.d.ts");
    const coreIndexDtsMap = Bun.file("./dist/core/index.d.ts.map");
    
    if (await coreIndexDts.exists()) {
      await Bun.write("./dist/index.d.ts", coreIndexDts);
      console.log("  ✓ Moved dist/core/index.d.ts -> dist/index.d.ts");
    }
    
    if (await coreIndexDtsMap.exists()) {
      await Bun.write("./dist/index.d.ts.map", coreIndexDtsMap);
      console.log("  ✓ Moved dist/core/index.d.ts.map -> dist/index.d.ts.map");
    }
  } catch (error) {
    console.warn("  ⚠️  Could not move core index.d.ts:", error);
  }

  // Fix paths in dist/index.d.ts to reference ./core/ instead of ./
  try {
    const indexDtsContent = await Bun.file("./dist/index.d.ts").text();
    const fixedContent = indexDtsContent.replace(
      /export \* from "\.\//g,
      'export * from "./core/'
    );
    await Bun.write("./dist/index.d.ts", fixedContent);
    console.log("  ✓ Fixed export paths in dist/index.d.ts");
  } catch (error) {
    console.warn("  ⚠️  Could not fix paths in index.d.ts:", error);
  }

  // Fix path aliases in .d.ts files
  console.log("  🔧 Fixing path aliases in .d.ts files...");
  try {
    const fixProcess = Bun.spawn({
      cmd: ["bun", "scripts/fix-dts-paths.ts"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const fixExitCode = await fixProcess.exited;
    if (fixExitCode !== 0) {
      console.warn("  ⚠️  Path alias fixing had issues, but continuing...");
    }
  } catch (error) {
    console.warn("  ⚠️  Could not run fix-dts-paths script:", error);
  }

  console.log("\n✅ Build completed successfully!");
  console.log("   📁 Main entry: dist/index.js + dist/index.d.ts");
  console.log("   📁 Plugins entry: dist/plugins/index.js + dist/plugins/index.d.ts");
}

build().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
