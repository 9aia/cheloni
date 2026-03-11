import z from "zod";

/**
 * A schema for an NPM package name with optional scope.
 * Returns an object: { scopeName?: string, packageName: string }
 */
export const packageNameSchema = z.string().min(1).max(214).transform((name) => {
    // Regex for a scoped package: @scope/package
    const scopedMatch = name.match(/^@([a-zA-Z0-9-_]+)\/([._a-zA-Z0-9][a-zA-Z0-9-_]*)$/);
    if (scopedMatch) {
        const [, scopeName, packageName] = scopedMatch;
        return { scopeName, packageName };
    }
    // Regex for an unscoped package: package
    const unscopedMatch = name.match(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/);
    if (unscopedMatch) {
        return { packageName: name };
    }
    throw new Error("Invalid npm package name");
})
    .describe("A valid NPM package name, possibly scoped, with returned scopeName if scoped.");
