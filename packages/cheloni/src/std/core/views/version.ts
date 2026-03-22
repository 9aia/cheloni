import type { CliManifest } from "~/core/manifest/cli";

interface ShowVersionParams {
  cliManifest: CliManifest;
}

export function showVersion({ cliManifest }: ShowVersionParams): void {
  const version = cliManifest.version;

  if (!version) {
    throw new Error("Version is not set");
  }

  console.log(version);
}
