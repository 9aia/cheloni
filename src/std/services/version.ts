import type { CliManifest } from "~/core/manifest/cli";

export function showVersion(cli: CliManifest) {
    const version = cli.version;

    if(!version) {
        throw new Error("Version is not set");
    }

    console.log(version);
}
