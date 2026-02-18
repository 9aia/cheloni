import { definePack } from "~/core/definition/pack";
import helpPlugin from "~/std/plugins/help";
import versionPlugin from "~/std/plugins/version";

export default definePack({
    name: "std",
    plugin: [helpPlugin, versionPlugin],
});
