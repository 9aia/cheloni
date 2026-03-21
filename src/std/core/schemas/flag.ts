import z from "zod";

/**
 * Boolean schema with a default value of true.
 */
export const flagSchema = z.boolean().default(true);
