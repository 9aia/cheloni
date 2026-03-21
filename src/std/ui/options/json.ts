import { defineOption } from "~/core/definition/command/option";
import { jsonOptionSchema } from "~/std/log/schemas/stdout";

export default defineOption({
    name: "json",
    schema: jsonOptionSchema,
});
