import { definePluginpack } from "~/core";
import { deprecationPlugin, helpPlugin, versionPlugin, errorHandlerPlugin } from "~/std/core";

export default definePluginpack({
    name: "base",
    plugins: [deprecationPlugin, helpPlugin, versionPlugin, errorHandlerPlugin],
});
