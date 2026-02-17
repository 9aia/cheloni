import z from "zod";
import type { Cli } from "~/core/creation/cli";
import type { Command } from "~/core/creation/command";
import type { CommandManifest } from "~/core/manifest/command";
import { getPositionalManifest } from "~/core/manifest/command/positional";
import { getSchemaAlias, getSchemaDeprecated, getSchemaDescription, getSchemaObject } from "~/lib/zod";

/**
 * Render a single option line with aliases and description
 */
function renderOption(name: string, schema: z.ZodTypeAny): void {
    const description = getSchemaDescription(schema);
    const alias = getSchemaAlias(schema);
    const deprecated = getSchemaDeprecated(schema);
    
    let line = `  --${name}`;
    if (alias) {
        const aliases = Array.isArray(alias) ? alias : [alias];
        line += `, ${aliases.map(a => `-${a}`).join(', ')}`;
    }
    line += `    ${description || ''}`;
    console.log(line);
    
    if (deprecated) {
        const message = typeof deprecated === 'string' ? deprecated : 'This option is deprecated';
        console.log(`    Deprecated: ${message}`);
    }
}

/**
 * Find a command in the tree by name or path, starting from a given command's subcommands.
 */
function findCommandInTree(command: Command, name: string): Command | undefined {
    for (const child of command.commands) {
        if (child.manifest.name === name) return child;
        if (child.paths?.includes(name)) return child;
    }
    // Deep search
    for (const child of command.commands) {
        const found = findCommandInTree(child, name);
        if (found) return found;
    }
    return undefined;
}

/**
 * Render command-specific help
 */
export function renderCommandHelp(cli: Cli, commandName: string): void {
    const cliName = cli.manifest.name;
    
    // Find command by name or path in the command tree
    let actualCommand: Command | undefined;

    if (cli.command) {
        if (cli.command.manifest.name === commandName || cli.command.paths?.includes(commandName)) {
            actualCommand = cli.command;
        } else {
            actualCommand = findCommandInTree(cli.command, commandName);
        }
    }
    
    if (!actualCommand) {
        console.error(`Command "${commandName}" not found`);
        process.exit(1);
    }
    
    const command: CommandManifest = actualCommand.manifest;
    const name = command.name;
    const description = command.description || '';
    const paths = command.paths || [];
    const deprecated = command.deprecated;
    
    console.log(`Usage: ${cliName} ${name}${command.positional ? ' <positional>' : ''} [options]\n`);
    
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
    
    // Render positional argument
    if (actualCommand.definition.positional) {
        const posManifest = getPositionalManifest(actualCommand.definition.positional);
        const posDesc = posManifest?.description;
        const posDeprecated = posManifest?.deprecated;
        console.log(`\nPositional:`);
        console.log(`  <positional>    ${posDesc || '(any)'}`);
        if (posDeprecated) {
            const message = typeof posDeprecated === 'string' ? posDeprecated : 'This argument is deprecated';
            console.log(`    Deprecated: ${message}`);
        }
    }
    
    // Render subcommands if any
    if (actualCommand.commands.size > 0) {
        console.log(`\nCommands:`);
        for (const cmd of actualCommand.commands) {
            const sub = cmd.manifest;
            let cmdLine = `  ${sub.name}`;
            if (sub.paths && sub.paths.length > 0) {
                cmdLine += ` (${sub.paths.join(', ')})`;
            }
            cmdLine += `    ${sub.description || ''}`;
            console.log(cmdLine);
        }
    }
    
    // Render command options (merged with global options)
    const commandOptions = getSchemaObject(actualCommand.definition.options ?? z.object({}));
    
    const hasCommandOptions = commandOptions && Object.keys(commandOptions).length > 0;
    const hasGlobalOptions = cli.globalOptions.size > 0;
    
    if (hasCommandOptions || hasGlobalOptions) {
        console.log(`\nOptions:`);
        
        // Render command-specific options
        if (commandOptions) {
            for (const [optName, optSchema] of Object.entries(commandOptions)) {
                renderOption(optName, optSchema);
            }
        }
        
        // Render global options (automatically available to all commands)
        for (const globalOpt of cli.globalOptions) {
            renderOption(globalOpt.definition.name, globalOpt.definition.schema ?? z.any());
        }
    }
    
    // Render examples
    if (command.example) {
        const examples = Array.isArray(command.example) ? command.example : [command.example];
        console.log(`\nExamples:`);
        for (const example of examples) {
            console.log(`  ${example}`);
        }
    }
}

/**
 * Render root CLI help
 */
export function renderRootHelp(cli: Cli): void {
    const cliName = cli.manifest.name;
    const cliVersion = cli.manifest.version;
    const description = cli.manifest.description;
    const details = cli.manifest.details;
    const deprecated = cli.manifest.deprecated;
    
    console.log(`Usage: ${cliName} [command] [options]\n`);
    
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
        for (const cmd of rootCommand.commands) {
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
    
    // Render details below commands
    if (details) {
        console.log('');
        console.log(details);
        console.log('');
    }
    
    console.log(`\nUse "${cliName} help <command>" for more information about a command.`);
}

/**
 * Main help function - dispatches to appropriate renderer
 */
export function showHelp(cli: Cli, commandName?: string): void {
    if (commandName) {
        renderCommandHelp(cli, commandName);
    } else {
        renderRootHelp(cli);
    }
}
