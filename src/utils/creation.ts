import type { Manifest } from "~/utils/definition";

export interface RuntimeObject<TManifest extends Manifest = Manifest> {
    manifest: TManifest;
}
