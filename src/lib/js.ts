import type { ObjectKey } from "./ts-utils";

export const NOOP = () => {};

export function normalizeMaybeArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export type KeyedSetAddOptions = {
  replace?: boolean;
};

export class KeyedSet<TItem, TKey = ObjectKey> {
  private readonly map: Map<TKey, TItem>;

  constructor(
    private readonly keyFn: (obj: TItem) => TKey,
    iterable?: Iterable<TItem> | null,
    options: KeyedSetAddOptions = {},
  ) {
    this.map = new Map<TKey, TItem>();
    if (iterable) {
      for (const item of iterable) {
        this.add(item, options);
      }
    }
  }

  add(obj: TItem, options: KeyedSetAddOptions = {}): this {
    const key = this.keyFn(obj);
    if (!options.replace && this.map.has(key)) {
      throw new Error(`Duplicate key: ${String(key)}`);
    }
    this.map.set(key, obj);
    return this;
  }

  has(obj: TItem): boolean {
    const key = this.keyFn(obj);
    return this.map.has(key);
  }

  delete(obj: TItem): boolean {
    const key = this.keyFn(obj);
    return this.map.delete(key);
  }

  values(): IterableIterator<TItem> {
    return this.map.values();
  }

  get(key: TKey): TItem | undefined {
    return this.map.get(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  [Symbol.iterator](): IterableIterator<TItem> {
    return this.map.values();
  }
}
