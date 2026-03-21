import { definePluginpack } from "~/core/definition/pack";
import deprecationPlugin from "~/std/plugins/deprecation";
import errorHandlerPlugin from "~/std/plugins/error-handler";
import helpPlugin from "~/std/plugins/help";
import versionPlugin from "~/std/plugins/version";

export default definePluginpack({
    name: "base",
    plugins: [deprecationPlugin, helpPlugin, versionPlugin, errorHandlerPlugin],
});
