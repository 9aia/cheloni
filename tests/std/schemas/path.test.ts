import { describe, it, expect } from 'vitest';
import { pathSchema, dirnameSchema, inputOptionSchema, outputOptionSchema } from '~/std/schemas/path';

describe('pathSchema', () => {
  it('accepts a simple filename', () => {
    expect(pathSchema.safeParse('file.txt').success).toBe(true);
  });

  it('accepts a relative path', () => {
    expect(pathSchema.safeParse('src/index.ts').success).toBe(true);
  });

  it('accepts an absolute Unix path', () => {
    expect(pathSchema.safeParse('/usr/local/bin/app').success).toBe(true);
  });

  it('accepts an absolute Windows path', () => {
    expect(pathSchema.safeParse('C:\\Users\\test\\file.txt').success).toBe(true);
  });

  it('accepts a path with spaces', () => {
    expect(pathSchema.safeParse('/my folder/my file.txt').success).toBe(true);
  });

  it('rejects paths with invalid characters', () => {
    expect(pathSchema.safeParse('file<name>.txt').success).toBe(false);
    expect(pathSchema.safeParse('file"name".txt').success).toBe(false);
    expect(pathSchema.safeParse('file|name.txt').success).toBe(false);
    expect(pathSchema.safeParse('file?name.txt').success).toBe(false);
    expect(pathSchema.safeParse('file*name.txt').success).toBe(false);
    expect(pathSchema.safeParse('file:name.txt').success).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(pathSchema.safeParse(123).success).toBe(false);
  });
});

describe('dirnameSchema', () => {
  it('accepts a directory with trailing slash', () => {
    expect(dirnameSchema.safeParse('src/').success).toBe(true);
  });

  it('accepts a directory without trailing slash', () => {
    expect(dirnameSchema.safeParse('src').success).toBe(true);
  });

  it('accepts an absolute Unix directory', () => {
    expect(dirnameSchema.safeParse('/usr/local/bin/').success).toBe(true);
  });

  it('accepts an absolute Windows directory', () => {
    expect(dirnameSchema.safeParse('C:\\Users\\test\\').success).toBe(true);
  });

  it('rejects paths with invalid characters', () => {
    expect(dirnameSchema.safeParse('dir<name>/').success).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(dirnameSchema.safeParse(123).success).toBe(false);
  });
});
