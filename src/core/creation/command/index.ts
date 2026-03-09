import type { Cli } from "~/core/creation/cli";
import type { InferOptionsType, Option } from "~/core/creation/command/option";
import { createOption } from "~/core/creation/command/option";
import type { InferPositionalType } from "~/core/creation/command/positional";
import type { CommandDefinition, RootCommandDefinition } from "~/core/definition/command";
import type { OptionSchema } from "~/core/definition/command/option";
import type { PositionalDefinition } from "~/core/definition/command/positional";
import { getCommandManifest, type CommandManifest } from "~/core/manifest/command";
import type { Promisable, UnknownRecord } from "type-fest";
import type { RuntimeObject } from "~/utils/creation";
import { ManifestKeyedMap } from "~/utils/definition";

export interface Command<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionSchema = any
> extends RuntimeObject<CommandManifest> {
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>;
    commands: ManifestKeyedMap<Command>;
    paths: string[];
    /**
     * Options that are inherited by subcommands.
     * @default []
     */
    bequeathOptions: ManifestKeyedMap<Option>;
}

export type RootCommand<
    TPositionalDefinition extends PositionalDefinition = any,
    TOptionsDefinition extends OptionSchema = any
> = Command<TPositionalDefinition, TOptionsDefinition>;

export interface CommandHandlerParams<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionSchema,
    TContext extends UnknownRecord = UnknownRecord,
> {
    positional: InferPositionalType<TPositionalDefinition>;
    options: InferOptionsType<TOptionsDefinition>;
    context: TContext;
    command: Command;
    cli: Cli;
}

export type CommandHandler<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionSchema,
    TContext extends UnknownRecord = UnknownRecord,
> = (params: CommandHandlerParams<TPositionalDefinition, TOptionsDefinition, TContext>) => Promisable<void>;

export function createCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionSchema
>(
    definition: CommandDefinition<TPositionalDefinition, TOptionsDefinition>,
    inheritedBequeathOptions: Option[] = []
): Command<TPositionalDefinition, TOptionsDefinition> {
    // Collect bequeathOptions from this command definition
    const bequeathOptionsMap = new ManifestKeyedMap<Option>();
    
    // Add inherited bequeathOptions from parent commands
    for (const inheritedOpt of inheritedBequeathOptions) {
        bequeathOptionsMap.set(inheritedOpt);
    }
    
    // Add this command's own bequeathOptions (they override inherited ones if same name)
    for (const bequeathOptDef of definition.bequeathOptions ?? []) {
        const bequeathOption = createOption(bequeathOptDef);
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
        bequeathOptions: bequeathOptionsMap,
    };
}

export function createRootCommand<
    TPositionalDefinition extends PositionalDefinition,
    TOptionsDefinition extends OptionSchema
>(
    definition: RootCommandDefinition<TPositionalDefinition, TOptionsDefinition>
): RootCommand<TPositionalDefinition, TOptionsDefinition> {
    return createCommand({ ...definition, name: "root" });
}
