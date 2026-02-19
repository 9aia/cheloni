import type { Cli } from "~/core/creation/cli";
import type { Context } from "~/core/execution/command";
import type { InferOptionsType } from "~/core/creation/command/option";
import type { InferPositionalType } from "~/core/creation/command/positional";
import type { CommandDefinition, RootCommandDefinition } from "~/core/definition/command";
import type { OptionDefinition } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import type { GlobalOption } from "~/core/creation/command/global-option";
import { createGlobalOption } from "~/core/creation/command/global-option";
import { getCommandManifest, type CommandManifest } from "~/core/manifest/command";
import type { Promisable } from "type-fest";
import type { RuntimeObject } from "~/utils/creation";
import { ManifestKeyedMap } from "~/utils/definition";

export interface Command<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any
> extends RuntimeObject<CommandManifest> {
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>;
    commands: ManifestKeyedMap<Command>;
    paths: string[];
    deprecated?: boolean | string;
    /**
     * Options that are inherited by subcommands.
     * @default []
     */
    bequeathOptions: ManifestKeyedMap<GlobalOption>;
}

export type RootCommand<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionDefinition = any
> = Command<TPositionalDefinition, TOptionsDefinition>;

export interface CommandHandlerParams<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
> {
    positional: InferPositionalType<TPositionalDefinition>;
    options: InferOptionsType<TOptionsDefinition>;
    context: Context;
    command: Command;
    cli: Cli;
}

export type CommandHandler<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
> = (params: CommandHandlerParams<TPositionalDefinition, TOptionsDefinition>) => Promisable<void>;

export function createCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>,
    inheritedBequeathOptions: GlobalOption[] = []
): Command<TPositionalDefinition, TOptionsDefinition> {
    // Collect bequeathOptions from this command definition
    const bequeathOptionsMap = new ManifestKeyedMap<GlobalOption>();
    
    // Add inherited bequeathOptions from parent commands
    for (const inheritedOpt of inheritedBequeathOptions) {
        bequeathOptionsMap.set(inheritedOpt);
    }
    
    // Add this command's own bequeathOptions (they override inherited ones if same name)
    for (const bequeathOptDef of definition.bequeathOptions ?? []) {
        const bequeathOption = createGlobalOption(bequeathOptDef);
        bequeathOptionsMap.set(bequeathOption);
    }
    
    // Collect all bequeathOptions to pass to children
    const allBequeathOptions = Array.from(bequeathOptionsMap.values());
    
    const commands = new ManifestKeyedMap<Command>();
    for (const childDef of definition.commands ?? []) {
        const childCommand = createCommand(childDef, allBequeathOptions);
        commands.set(childCommand);
    }

    return {
        definition,
        manifest: getCommandManifest(definition),
        commands,
        paths: definition.paths ?? [definition.name],
        deprecated: definition.deprecated,
        bequeathOptions: bequeathOptionsMap,
    };
}

export function createRootCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionDefinition
>(
    definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>
): RootCommand<TPositionalDefinition, TOptionsDefinition> {
    return createCommand({ ...definition, name: "root" });
}
