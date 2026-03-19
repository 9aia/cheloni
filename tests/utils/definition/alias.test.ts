import { describe, expect, it } from "vitest";
import z from "zod";
import { getAliasMap } from "~/utils/definition";

describe("utils/definition/getAliasMap", () => {
    it("returns empty object when schema is undefined", () => {
        expect(getAliasMap(undefined)).toEqual({});
    });

    it("returns empty object when no aliases are defined", () => {
        const schema = z.object({
            foo: z.string(),
            bar: z.number(),
        });

        expect(getAliasMap(schema)).toEqual({});
    });

    it("extracts aliases from option schema metadata", () => {
        const schema = z.object({
            verbose: z.boolean().meta({ aliases: ["v"] }),
            help: z.boolean(),
            force: z.boolean().meta({ aliases: ["f", "F"] }),
        });

        expect(getAliasMap(schema)).toEqual({
            verbose: ["v"],
            force: ["f", "F"],
        });
    });
});
