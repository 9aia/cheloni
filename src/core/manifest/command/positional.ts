import type { PositionalDefinition } from "~/core/definition/command/positional";
import { getSchemaDefaultValue } from "~/core/manifest/command/schema";
import { type Manifest } from "~/utils/definition";

export interface PositionalManifest extends Manifest {
    description?: string;
    details?: string;
    deprecated: boolean | string;
    defaultValue?: unknown;
}

export function getPositionalManifest(schema: PositionalDefinition): PositionalManifest {
    const meta = schema.meta() ?? {} as Record<string, unknown>;
    return {
        name: (meta.name as string) ?? "positional",
        description: meta.description as string | undefined,
        details: meta.details as string | undefined,
        deprecated: (meta.deprecated as boolean | string) ?? false,
        defaultValue: getSchemaDefaultValue(schema),
    };
}
