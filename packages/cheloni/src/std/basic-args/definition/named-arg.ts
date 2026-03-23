import type z from "zod";
import type { ArgDef, ArgSpec } from "./arg";
import type { UnknownArray, UnknownRecord } from "type-fest";

export type NamedArgSpec<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = ArgSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>
  & Readonly<{
    aliases?: string[];
  }>;

export type NamedArgDef<TSchema extends z.ZodTypeAny, TValue extends unknown, TNamedArgs extends UnknownRecord, TPositionals extends UnknownArray, TCtx extends UnknownRecord>
  = ArgDef<TSchema, TValue, TNamedArgs, TPositionals, TCtx>
  & NamedArgSpec<TSchema, TValue, TNamedArgs, TPositionals, TCtx>
  & Readonly<{
    kind: "option" | "flag";
  }>;
