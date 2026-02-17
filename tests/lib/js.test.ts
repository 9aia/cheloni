import { describe, it, expect } from 'vitest';
import { normalizeMaybeArray, KeyedSet, NOOP } from '~/lib/js';

describe('normalizeMaybeArray', () => {
  it('returns empty array for undefined', () => {
    expect(normalizeMaybeArray(undefined)).toEqual([]);
  });

  it('returns array for single value', () => {
    expect(normalizeMaybeArray('value')).toEqual(['value']);
  });

  it('returns array as-is for array input', () => {
    expect(normalizeMaybeArray([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('NOOP', () => {
  it('is a function that does nothing', () => {
    expect(typeof NOOP).toBe('function');
    expect(NOOP()).toBeUndefined();
  });
});

describe('KeyedSet', () => {
  it('creates empty set', () => {
    const set = new KeyedSet<{ id: number }>(item => item.id);
    expect(set.size).toBe(0);
  });

  it('adds items with unique keys', () => {
    const set = new KeyedSet<{ id: number; name: string }>(item => item.id);
    set.add({ id: 1, name: 'a' });
    set.add({ id: 2, name: 'b' });
    expect(set.size).toBe(2);
  });

  it('throws on duplicate keys by default', () => {
    const set = new KeyedSet<{ id: number }>(item => item.id);
    set.add({ id: 1 });
    expect(() => set.add({ id: 1 })).toThrow('Duplicate key: 1');
  });

  it('replaces item when replace option is true', () => {
    const set = new KeyedSet<{ id: number; name: string }>(item => item.id);
    set.add({ id: 1, name: 'a' });
    set.add({ id: 1, name: 'b' }, { replace: true });
    expect(set.size).toBe(1);
    expect([...set][0]!.name).toBe('b');
  });

  it('checks if item exists', () => {
    const set = new KeyedSet<{ id: number }>(item => item.id);
    const item = { id: 1 };
    set.add(item);
    expect(set.has(item)).toBe(true);
    const otherItem = { id: 1 };
    expect(set.has(otherItem)).toBe(true);
  });

  it('deletes items', () => {
    const set = new KeyedSet<{ id: number }>(item => item.id);
    const item = { id: 1 };
    set.add(item);
    expect(set.delete(item)).toBe(true);
    expect(set.size).toBe(0);
    expect(set.delete(item)).toBe(false);
  });

  it('gets item by key', () => {
    const set = new KeyedSet<{ id: number; name: string }>(item => item.id);
    const item = { id: 1, name: 'test' };
    set.add(item);
    expect(set.get(1)).toBe(item);
    expect(set.get(2)).toBeUndefined();
  });

  it('clears all items', () => {
    const set = new KeyedSet<{ id: number }>(item => item.id);
    set.add({ id: 1 });
    set.add({ id: 2 });
    set.clear();
    expect(set.size).toBe(0);
  });

  it('is iterable', () => {
    const set = new KeyedSet<{ id: number; name: string }>(item => item.id);
    set.add({ id: 1, name: 'a' });
    set.add({ id: 2, name: 'b' });
    const items = [...set];
    expect(items).toHaveLength(2);
  });

  it('initializes from iterable', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const set = new KeyedSet<{ id: number }>(item => item.id, items);
    expect(set.size).toBe(2);
  });
});
