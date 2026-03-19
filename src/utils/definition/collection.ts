import type { RuntimeObject } from "../creation/runtime-object";

/**
 * A Map that is keyed by the manifest name.
 */
export class ManifestKeyedMap<T extends RuntimeObject = RuntimeObject> extends Map<string, T> {
    override set(key: string, value: T): this;
    override set(value: T): this;

    override set(keyOrValue: string | T, value?: T): this {
        if (value !== undefined) {
            return super.set((value as T).manifest.name, value);
        }

        const val = keyOrValue as T;
        return super.set(val.manifest.name, val);
    }
}
