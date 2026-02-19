import { defineGlobalOption } from "~/core/definition/command/global-option";
import { jsonOptionSchema } from "~/std/schemas/out";

export default defineGlobalOption({
    name: "json",
    schema: jsonOptionSchema,
});
