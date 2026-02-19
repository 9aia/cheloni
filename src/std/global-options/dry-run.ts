import { defineGlobalOption } from "~/core/definition/command/global-option";
import { dryRunOptionSchema } from "~/std/schemas/dry-run";

export default defineGlobalOption({
    name: "dry-run",
    schema: dryRunOptionSchema,
});
