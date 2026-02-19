import z from "zod";

export const forceOptionSchema = z
    .boolean()
    .optional()
    .meta({
        description: "Force the command to run",
        details: "Don't ask for confirmation for dangerous actions.",
        aliases: ["f"]
    });
