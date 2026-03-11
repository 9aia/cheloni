import { defineOption } from "~/core/definition/command/option";
import { dryRunOptionSchema } from "~/std/schemas/dev-tooling";

export default defineOption({
    name: "dry-run",
    schema: dryRunOptionSchema,
});
