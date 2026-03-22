import { defineOption } from "~/core/definition/command/option";
import { dryRunOptionSchema } from "~/std/core/schemas/dry-run";

export default defineOption({
  name: "dry-run",
  schema: dryRunOptionSchema,
});
