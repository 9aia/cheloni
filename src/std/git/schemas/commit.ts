import z from "zod";

export const commitHashSchema = z
    .string()
    .regex(/^[0-9a-f]{40}$/i, "Invalid git commit hash");

export const commitHashShortSchema = z
    .string()
    .regex(/^[0-9a-f]{7,40}$/, "Invalid short commit hash");
