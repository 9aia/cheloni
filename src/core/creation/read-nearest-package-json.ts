import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface PackageJsonCliFields {
    name?: string;
    version?: string;
    description?: string;
}

/**
 * Reads the closest `package.json` walking up from the directory of `metaUrl`.
 */
export async function readNearestPackageJson(metaUrl: string | URL): Promise<PackageJsonCliFields> {
    let dir = dirname(fileURLToPath(typeof metaUrl === "string" ? new URL(metaUrl) : metaUrl));

    for (;;) {
        const pkgPath = join(dir, "package.json");
        try {
            const raw = await readFile(pkgPath, "utf8");
            const parsed: unknown = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                return {};
            }
            const rec = parsed as Record<string, unknown>;
            const name = typeof rec.name === "string" ? rec.name : undefined;
            const version = typeof rec.version === "string" ? rec.version : undefined;
            const description = typeof rec.description === "string" ? rec.description : undefined;
            return { name, version, description };
        } catch (err) {
            if (
                err &&
                typeof err === "object" &&
                "code" in err &&
                (err as NodeJS.ErrnoException).code === "ENOENT"
            ) {
                const parent = dirname(dir);
                if (parent === dir) {
                    throw new Error(
                        `createCli: no package.json found when resolving metadata from ${String(metaUrl)}`,
                    );
                }
                dir = parent;
                continue;
            }
            throw err;
        }
    }
}
