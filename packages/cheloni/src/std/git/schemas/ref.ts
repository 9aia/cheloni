import z from "zod";

const GIT_REF_FORBIDDEN = new Set([" ", "~", "^", ":", "?", "*", "\\", "["]);

function hasInvalidGitRefChar(value: string): boolean {
  for (const c of value) {
    const cp = c.codePointAt(0)!;
    if (cp <= 0x1f || cp === 0x7f) return true;
    if (GIT_REF_FORBIDDEN.has(c)) return true;
  }
  return false;
}

export const gitRefSchema = z
  .string()
  .min(1)
  .refine((v) => !hasInvalidGitRefChar(v), "Invalid git ref")
  .refine((v) => !v.startsWith("/") && !v.endsWith("/"), "Git ref must not start or end with '/'")
  .refine((v) => !v.includes(".."), "Git ref must not contain '..'")
  .refine((v) => !v.endsWith(".lock"), "Git ref must not end with '.lock'")
  .refine((v) => !v.endsWith("."), "Git ref must not end with '.'");
