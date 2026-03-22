import { HaltError } from "./errors";

export function halt(): never {
  throw new HaltError();
}

export type HaltFunction = typeof halt;
