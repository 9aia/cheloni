import type { Command } from "~/core/creation/command";
import { getOptionsManifest } from "~/core/manifest/command/option";
import { getPositionalManifest } from "~/core/manifest/command/positional";
import { InvalidOptionsError, InvalidPositionalError } from "./errors";

interface HandleErrorOptions {
    command: Command;
    error: unknown;
}

export function handleError({ error, command }: HandleErrorOptions) {
    if (error instanceof InvalidPositionalError || error instanceof InvalidOptionsError) {
        handleSchemaError({ error, command });
    } else if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error("An unknown error occurred");
    }
}

interface HandleValidationErrorOptions {
    error: InvalidPositionalError | InvalidOptionsError;
    command: Command;
}

// TODO: improve this
function handleSchemaError({ error, command }: HandleValidationErrorOptions) {
    console.error("Schema error:");

    for (const err of error.issues) {
        let fieldName: string;
        
        // Extract path segments - handle both PropertyKey and PathSegment objects
        const pathSegments = err.path?.map((p: PropertyKey | any) => {
            if (typeof p === 'object' && p !== null && 'key' in p) {
                return p.key;
            }
            return p;
        }) || [];
        
        if (pathSegments.length === 0) {
            // Empty path means it's a positional argument
            const positionalSchema = command.definition.positional;
            const description = positionalSchema ? getPositionalManifest(positionalSchema) : null;
            if (description?.description) {
                fieldName = `positional argument: ${description.description}`;
            } else {
                fieldName = "positional argument";
            }
        } else {
            // Non-empty path means it's an option
            const optionName = pathSegments.join(".");
            // Try to get the schema for this option from the options schema
            const optionsManifest = command.definition.options ? getOptionsManifest(command.definition.options) : [];
            const optionManifest = optionsManifest?.find(option => option.name === optionName);

            if (optionManifest?.description) {
                fieldName = `option --${optionName}: ${optionManifest.description}`;
            } else {
                fieldName = `option --${optionName}`;
            }
        }
        
        console.error(`  ${fieldName}: ${err.message}`);
    }
}
