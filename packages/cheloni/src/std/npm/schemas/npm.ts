import z from "zod";

export const packageNameSchema = z
  .string()
  .min(1)
  .max(214)
  .transform((name) => {
    const scopedMatch = name.match(/^@([a-zA-Z0-9-_]+)\/([._a-zA-Z0-9][a-zA-Z0-9-_]*)$/);
    if (scopedMatch) {
      const [, scopeName, packageName] = scopedMatch;
      return { scopeName, packageName };
    }
    const unscopedMatch = name.match(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/);
    if (unscopedMatch) {
      return { packageName: name };
    }
    throw new Error("Invalid npm package name");
  })
  .describe("A valid NPM package name, possibly scoped, with returned scopeName if scoped.");
