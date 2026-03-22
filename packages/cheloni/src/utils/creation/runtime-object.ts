import type { Manifest } from "~/utils/definition";

/**
 * A runtime representation of a definition.
 * It has a manifest which is a serializable representation of the definition.
 */
export interface RuntimeObject<TManifest extends Manifest = Manifest> {
  manifest: TManifest;
}
