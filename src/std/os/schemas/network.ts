import z from "zod";

export const portSchema = z.string().regex(
    /^\d{1,5}$/,
    "Invalid port number",
);

export const portOptionSchema = portSchema.describe("Port number").meta({ aliases: ["p"] });

const hostnameLabelRe = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)$/;

export const hostnameSchema = z
    .string()
    .max(253)
    .refine(
        (value) =>
            value.length > 0 &&
            value.split(".").every((label) => hostnameLabelRe.test(label)),
        "Invalid hostname",
    );

export const hostSchema = z.union([z.ipv4(), z.ipv6(), hostnameSchema]);
