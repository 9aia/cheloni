import { describe, it, expect } from 'vitest';
import {
  semverSchema,
  gitTagSchema,
  gitRefSchema,
  branchNameSchema,
  commitHashSchema,
  commitHashShortSchema,
} from '~/std/schemas/dev-tooling';

describe('semverSchema', () => {
  it('accepts a stable version', async () => {
    const result = await semverSchema.safeParseAsync('1.0.0');
    expect(result.success).toBe(true);
    expect(result.data).toBe('1.0.0');
  });

  it('accepts a version with a prerelease tag', async () => {
    expect((await semverSchema.safeParseAsync('1.0.0-alpha.1')).success).toBe(true);
  });

  it('accepts a version with build metadata', async () => {
    expect((await semverSchema.safeParseAsync('1.0.0+build.123')).success).toBe(true);
  });

  it('accepts a version with prerelease and build metadata', async () => {
    expect((await semverSchema.safeParseAsync('1.0.0-beta.2+build.456')).success).toBe(true);
  });

  it('accepts a version with leading v', async () => {
    expect((await semverSchema.safeParseAsync('v1.2.3')).success).toBe(true);
  });

  it('rejects a partial version', async () => {
    expect((await semverSchema.safeParseAsync('1.0')).success).toBe(false);
  });

  it('rejects a plain number', async () => {
    expect((await semverSchema.safeParseAsync('1')).success).toBe(false);
  });

  it('rejects an empty string', async () => {
    expect((await semverSchema.safeParseAsync('')).success).toBe(false);
  });

  it('rejects arbitrary text', async () => {
    expect((await semverSchema.safeParseAsync('not-a-version')).success).toBe(false);
  });

  it('rejects non-string input', async () => {
    expect((await semverSchema.safeParseAsync(100)).success).toBe(false);
  });
});

describe('gitTagSchema', () => {
  it('accepts a simple tag', () => {
    expect(gitTagSchema.safeParse('v1.0.0').success).toBe(true);
  });

  it('accepts a tag with hyphens and dots', () => {
    expect(gitTagSchema.safeParse('release-1.2.3').success).toBe(true);
  });

  it('accepts a plain name', () => {
    expect(gitTagSchema.safeParse('latest').success).toBe(true);
  });

  it('rejects tags containing "/"', () => {
    expect(gitTagSchema.safeParse('refs/tags/v1').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(gitTagSchema.safeParse('').success).toBe(false);
  });

  it('rejects tags containing ".."', () => {
    expect(gitTagSchema.safeParse('v1..0').success).toBe(false);
  });

  it('rejects tags ending with ".lock"', () => {
    expect(gitTagSchema.safeParse('v1.lock').success).toBe(false);
  });

  it('rejects tags ending with "."', () => {
    expect(gitTagSchema.safeParse('v1.').success).toBe(false);
  });

  it('rejects tags with spaces', () => {
    expect(gitTagSchema.safeParse('my tag').success).toBe(false);
  });

  it('rejects tags with forbidden characters', () => {
    expect(gitTagSchema.safeParse('v1~0').success).toBe(false);
    expect(gitTagSchema.safeParse('v1^0').success).toBe(false);
    expect(gitTagSchema.safeParse('v1:0').success).toBe(false);
    expect(gitTagSchema.safeParse('v1?0').success).toBe(false);
    expect(gitTagSchema.safeParse('v1*0').success).toBe(false);
    expect(gitTagSchema.safeParse('v1[0').success).toBe(false);
  });
});

describe('gitRefSchema', () => {
  it('accepts a simple ref', () => {
    expect(gitRefSchema.safeParse('main').success).toBe(true);
  });

  it('accepts a namespaced ref', () => {
    expect(gitRefSchema.safeParse('refs/heads/main').success).toBe(true);
  });

  it('accepts a tag-like ref', () => {
    expect(gitRefSchema.safeParse('v1.0.0').success).toBe(true);
  });

  it('accepts a ref with hyphens and dots', () => {
    expect(gitRefSchema.safeParse('feature/my-branch.1').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(gitRefSchema.safeParse('').success).toBe(false);
  });

  it('rejects refs containing ".."', () => {
    expect(gitRefSchema.safeParse('a..b').success).toBe(false);
  });

  it('rejects refs ending with ".lock"', () => {
    expect(gitRefSchema.safeParse('branch.lock').success).toBe(false);
  });

  it('rejects refs ending with "."', () => {
    expect(gitRefSchema.safeParse('branch.').success).toBe(false);
  });

  it('rejects refs starting with "/"', () => {
    expect(gitRefSchema.safeParse('/main').success).toBe(false);
  });

  it('rejects refs ending with "/"', () => {
    expect(gitRefSchema.safeParse('main/').success).toBe(false);
  });

  it('rejects refs with spaces', () => {
    expect(gitRefSchema.safeParse('my branch').success).toBe(false);
  });

  it('rejects refs with control characters', () => {
    expect(gitRefSchema.safeParse('main\x00').success).toBe(false);
  });

  it('rejects refs with "~", "^", ":", "?", "*", "["', () => {
    expect(gitRefSchema.safeParse('main~1').success).toBe(false);
    expect(gitRefSchema.safeParse('main^2').success).toBe(false);
    expect(gitRefSchema.safeParse('a:b').success).toBe(false);
    expect(gitRefSchema.safeParse('a?b').success).toBe(false);
    expect(gitRefSchema.safeParse('a*b').success).toBe(false);
    expect(gitRefSchema.safeParse('a[b').success).toBe(false);
  });
});

describe('branchNameSchema', () => {
  it('accepts valid branch names', () => {
    expect(branchNameSchema.safeParse('main').success).toBe(true);
    expect(branchNameSchema.safeParse('feature/login').success).toBe(true);
    expect(branchNameSchema.safeParse('fix/issue-42').success).toBe(true);
  });

  it('rejects bare "@"', () => {
    expect(branchNameSchema.safeParse('@').success).toBe(false);
  });

  it('inherits gitRef restrictions', () => {
    expect(branchNameSchema.safeParse('a..b').success).toBe(false);
    expect(branchNameSchema.safeParse('').success).toBe(false);
  });
});

describe('commitHashSchema', () => {
  it('accepts a valid 40-char lowercase hex hash', () => {
    expect(commitHashSchema.safeParse('da39a3ee5e6b4b0d3255bfef95601890afd80709').success).toBe(true);
  });

  it('accepts a valid 40-char uppercase hex hash', () => {
    expect(commitHashSchema.safeParse('DA39A3EE5E6B4B0D3255BFEF95601890AFD80709').success).toBe(true);
  });

  it('rejects a short hash', () => {
    expect(commitHashSchema.safeParse('da39a3e').success).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(commitHashSchema.safeParse('zz39a3ee5e6b4b0d3255bfef95601890afd80709').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(commitHashSchema.safeParse('').success).toBe(false);
  });
});

describe('commitHashShortSchema', () => {
  it('accepts a 7-char short hash', () => {
    expect(commitHashShortSchema.safeParse('da39a3e').success).toBe(true);
  });

  it('accepts a full 40-char hash', () => {
    expect(commitHashShortSchema.safeParse('da39a3ee5e6b4b0d3255bfef95601890afd80709').success).toBe(true);
  });

  it('accepts an intermediate-length hash', () => {
    expect(commitHashShortSchema.safeParse('da39a3ee5e6b').success).toBe(true);
  });

  it('rejects fewer than 7 characters', () => {
    expect(commitHashShortSchema.safeParse('da39a3').success).toBe(false);
  });

  it('rejects more than 40 characters', () => {
    expect(commitHashShortSchema.safeParse('a'.repeat(41)).success).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(commitHashShortSchema.safeParse('zz39a3e').success).toBe(false);
  });
});
