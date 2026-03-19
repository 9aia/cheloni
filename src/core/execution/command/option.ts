import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";

export function buildOptionNames(cli: Cli, command: Command): Set<string> {
    void cli;

    // mri returns BOTH the canonical key AND the alias key(s) in the parsed output.
    // Include global option aliases here so unknown-option validation doesn't reject `-h`, `-v`, etc.
    const names = new Set<string>();

    // Include bequeathOptions from parent commands
    for (const opt of command.bequeathOptions.values()) {
        names.add(opt.definition.name);
        const aliases = opt.manifest.aliases;
        for (const a of aliases) {
            if (a) names.add(a);
        }
    }

    return names;
}
