import type { GlobalOptionDefinition } from "~/core/definition/command/global-option";
import { getGlobalOptionManifest, type GlobalOptionManifest } from "~/core/manifest/command/global-option";
import type { RuntimeObject } from "~/utils/creation";

export interface GlobalOption extends RuntimeObject<GlobalOptionManifest> {
    definition: GlobalOptionDefinition;
}

export function createGlobalOption(definition: GlobalOptionDefinition): GlobalOption {
    return {
        definition,
        manifest: getGlobalOptionManifest(definition),
    };
}
