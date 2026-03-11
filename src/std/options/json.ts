import { defineOption } from "~/core/definition/command/option";
import { jsonOptionSchema } from "~/std/schemas/stdout";

export default defineOption({
    name: "json",
    schema: jsonOptionSchema,
});
