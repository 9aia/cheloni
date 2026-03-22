import z from "zod";

const GIT_TAG_FORBIDDEN = new Set([" ", "~", "^", ":", "?", "*", "/", "\\", "["]);

function hasInvalidGitTagChar(value: string): boolean {
  for (const c of value) {
    const cp = c.codePointAt(0)!;
    if (cp <= 0x1f || cp === 0x7f) return true;
    if (GIT_TAG_FORBIDDEN.has(c)) return true;
  }
  return false;
}

export const gitTagSchema = z
  .string()
  .min(1)
  .refine((v) => !hasInvalidGitTagChar(v), "Invalid git tag")
  .refine((v) => !v.includes(".."), "Git tag must not contain '..'")
  .refine((v) => !v.endsWith(".lock"), "Git tag must not end with '.lock'")
  .refine((v) => !v.endsWith("."), "Git tag must not end with '.'");
