import type { GlobalOptionDefinition } from "~/core/definition/command/global-option";
import { getGlobalOptionManifest, type GlobalOptionManifest } from "~/core/manifest/command/global-option";

export interface GlobalOption {
    definition: GlobalOptionDefinition;
    manifest: GlobalOptionManifest;
}

export function createGlobalOption(definition: GlobalOptionDefinition): GlobalOption {
    return {
        definition,
        manifest: getGlobalOptionManifest(definition),
    };
}
