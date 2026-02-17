import type z from "zod";
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

export type InferGlobalOptionsType<TSchema extends z.ZodTypeAny | undefined = any> = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : {};
