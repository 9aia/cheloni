import { defineGlobalOption } from "~/core/definition/command/global-option";
import { configOptionSchema } from "~/std/schemas/config";

export default defineGlobalOption({
    name: "config",
    schema: configOptionSchema,
});
