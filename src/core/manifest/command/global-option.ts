import type { GlobalOptionDefinition } from "~/core/definition/command/global-option";
import { getOptionManifest, type OptionManifest } from "~/core/manifest/command/option";

export interface GlobalOptionManifest extends OptionManifest {}

export function getGlobalOptionManifest(globalOptionDefinition: GlobalOptionDefinition): GlobalOptionManifest {
    const manifest = getOptionManifest(globalOptionDefinition.name, globalOptionDefinition.schema);
    return manifest;
}
