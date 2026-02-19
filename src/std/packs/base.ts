import { definePluginpack } from "~/core/definition/pack";
import helpPlugin from "~/std/plugins/help";
import versionPlugin from "~/std/plugins/version";

export default definePluginpack({
    name: "base",
    plugins: [helpPlugin, versionPlugin],
});
