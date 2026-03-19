import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { OptionManifest } from "~/core/manifest/command/option";
import type { PositionalManifest } from "~/core/manifest/command/positional";
import { findCommandInTree } from "~/utils/execution/router";

function showOptionHelp(option: OptionManifest): void {
    let line = `  --${option.name}`;
    if (option.aliases && option.aliases.length > 0) {
        line += `, ${option.aliases.map(a => `-${a}`).join(', ')}`;
    }
    line += `    ${option.description || ''}`;
    console.log(line);

    if (option.deprecated) {
        const message = typeof option.deprecated === 'string' ? option.deprecated : 'This option is deprecated';
        console.log(`    Deprecated: ${message}`);
    }
}

function showPositionalHelp(positional: PositionalManifest): void {
    const label = positional.name || 'positional';
    console.log(`\nPositional:`);
    console.log(`  <${label}>    ${positional.description || '(any)'}`);
    if (positional.deprecated) {
        const message = typeof positional.deprecated === 'string' ? positional.deprecated : 'This argument is deprecated';
        console.log(`    Deprecated: ${message}`);
    }
}

function showCommandHelp(cli: Cli, commandName: string): void {
    const cliName = cli.manifest.name;

    let actualCommand: Command | undefined;

    if (cli.command) {
        if (cli.command.manifest.name === commandName || cli.command.paths?.includes(commandName)) {
            actualCommand = cli.command;
        } else {
            actualCommand = findCommandInTree(cli.command, commandName);
        }
    }

    if (!actualCommand) {
        throw new Error(`Internal error: Command "${commandName}" not found`);
    }

    const { name, description, paths = [], deprecated, positional, options, examples } = actualCommand.manifest;

    const posName = positional?.name || 'positional';
    console.log(`Usage: ${cliName} ${name}${positional ? ` <${posName}>` : ''} [options]\n`);

    if (description) {
        console.log(description);
        console.log('');
    }

    if (paths.length > 0) {
        console.log(`Aliases: ${paths.join(', ')}`);
    }

    if (deprecated) {
        const message = typeof deprecated === 'string' ? deprecated : 'This command is deprecated';
        console.log(`Deprecated: ${message}`);
    }

    if (positional) {
        showPositionalHelp(positional);
    }

    // Show subcommands if any
    if (actualCommand.commands.size > 0) {
        console.log(`\nCommands:`);
        for (const cmd of actualCommand.commands.values()) {
            const sub = cmd.manifest;
            let cmdLine = `  ${sub.name}`;
            if (sub.paths && sub.paths.length > 0) {
                cmdLine += ` (${sub.paths.join(', ')})`;
            }
            cmdLine += `    ${sub.description || ''}`;
            console.log(cmdLine);
        }
    }

    const hasCommandOptions = options && options.length > 0;
    const hasBequeathOptions = actualCommand.bequeathOptions.size > 0;

    if (hasCommandOptions || hasBequeathOptions) {
        console.log(`\nOptions:`);

        if (options) {
            for (const opt of options) {
                showOptionHelp(opt);
            }
        }

        for (const bequeathOpt of actualCommand.bequeathOptions.values()) {
            showOptionHelp(bequeathOpt.manifest);
        }
    }

    if (examples && examples.length > 0) {
        console.log(`\nExamples:`);
        for (const example of examples) {
            console.log(`  ${example}`);
        }
    }
}

function showUsage(cli: Cli): void {
    const rootCommand = cli.command;
    const hasCommands = rootCommand && rootCommand.commands.size > 0;
    const hasOptions = (rootCommand && rootCommand.bequeathOptions.size > 0) || rootCommand?.definition.options;
    const hasPositional = rootCommand && rootCommand.definition.positional;

    let usageParts = [cli.manifest.name];
    if (hasCommands) {
        usageParts.push('<command>');
    }
    if (hasOptions) {
        usageParts.push('[...options]');
    }
    if (hasPositional) {
        usageParts.push('[...args]');
    }

    console.log(`Usage: ${usageParts.join(' ')}\n`);
}

function showRootHelp(cli: Cli): void {
    const cliName = cli.manifest.name;
    const cliVersion = cli.manifest.version;
    const description = cli.manifest.description;
    const details = cli.manifest.details;
    const deprecated = cli.manifest.deprecated;

    // Build usage string based on available components
    showUsage(cli);

    if (cliVersion) {
        console.log(`Version: ${cliVersion}\n`);
    }

    if (deprecated) {
        const message = typeof deprecated === 'string' ? deprecated : 'This CLI is deprecated';
        console.log(`Deprecated: ${message}\n`);
    }

    if (description) {
        console.log(description);
        console.log('');
    }

    // Show subcommands from the root command
    const rootCommand = cli.command;
    if (rootCommand && rootCommand.commands.size > 0) {
        console.log(`Commands:`);
        for (const cmd of rootCommand.commands.values()) {
            const command = cmd.manifest;
            const name = command.name;
            const commandDescription = command.description || '';
            const paths = command.paths || [];
            const cmdDeprecated = command.deprecated;

            let cmdLine = `  ${name}`;
            if (paths.length > 0) {
                cmdLine += ` (${paths.join(', ')})`;
            }
            cmdLine += `    ${commandDescription}`;
            console.log(cmdLine);

            if (cmdDeprecated) {
                const message = typeof cmdDeprecated === 'string' ? cmdDeprecated : 'This command is deprecated';
                console.log(`    Deprecated: ${message}`);
            }
        }
    }

    // Show details below commands
    if (details) {
        console.log('');
        console.log(details);
        console.log('');
    }

    console.log(`\nUse "${cliName} help <command>" for more information about a command.`);
}

/**
 * Shows help for the CLI or a specific command
 */
export function showHelp(cli: Cli, commandName?: string): void {
    if (commandName) {
        showCommandHelp(cli, commandName);
    } else {
        showRootHelp(cli);
    }
}
