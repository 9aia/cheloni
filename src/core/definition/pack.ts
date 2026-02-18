import type { MaybeArray } from "~/lib/ts-utils";
import type { PluginDefinition } from "./plugin";

export interface PackDefinition {
    name: string;
    plugin: MaybeArray<PluginDefinition>;
}

export function definePack(definition: PackDefinition): PackDefinition {
    return definition;
}
