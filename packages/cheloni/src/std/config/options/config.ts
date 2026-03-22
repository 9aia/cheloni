import { defineOption } from "~/core/definition/command/option";
import { configOptionSchema } from "~/std/config/schemas/config";

export default defineOption({
  name: "config",
  schema: configOptionSchema,
});
