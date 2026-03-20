import { defineOption } from "~/core/definition/command/option";
import { dryRunOptionSchema } from "~/std/schemas/dry-run";

export default defineOption({
    name: "dry-run",
    schema: dryRunOptionSchema,
});
