import { defineOption } from "~/core/definition/command/option";
import { forceOptionSchema } from "~/std/ui/schemas/interaction";

export default defineOption({
    name: "force",
    schema: forceOptionSchema,
});
