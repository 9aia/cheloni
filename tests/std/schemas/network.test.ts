import { describe, it, expect } from 'vitest';
import {
  portSchema,
  hostnameSchema,
  hostSchema,
} from '~/std/schemas/network';

describe('portSchema', () => {
  it('accepts a valid port number string', () => {
    expect(portSchema.safeParse('3000').success).toBe(true);
    expect(portSchema.safeParse('8080').success).toBe(true);
    expect(portSchema.safeParse('80').success).toBe(true);
  });

  it('accepts single-digit port', () => {
    expect(portSchema.safeParse('0').success).toBe(true);
  });

  it('accepts five-digit port', () => {
    expect(portSchema.safeParse('65535').success).toBe(true);
  });

  it('rejects port with more than 5 digits', () => {
    expect(portSchema.safeParse('123456').success).toBe(false);
  });

  it('rejects non-numeric strings', () => {
    expect(portSchema.safeParse('abc').success).toBe(false);
    expect(portSchema.safeParse('80a').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(portSchema.safeParse('').success).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(portSchema.safeParse(3000).success).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(portSchema.safeParse('-1').success).toBe(false);
  });

  it('rejects numbers greater than 5 digits', () => {
    expect(portSchema.safeParse('123456').success).toBe(false);
  });
});

describe('hostnameSchema', () => {
  it('accepts valid hostnames', () => {
    expect(hostnameSchema.safeParse('example').success).toBe(true);
    expect(hostnameSchema.safeParse('example.com').success).toBe(true);
    expect(hostnameSchema.safeParse('sub.example.com').success).toBe(true);
    expect(hostnameSchema.safeParse('my-host').success).toBe(true);
    expect(hostnameSchema.safeParse('localhost').success).toBe(true);
  });

  it('accepts single-char labels', () => {
    expect(hostnameSchema.safeParse('a.b.c').success).toBe(true);
  });

  it('rejects labels starting with a hyphen', () => {
    expect(hostnameSchema.safeParse('-bad.com').success).toBe(false);
  });

  it('rejects labels ending with a hyphen', () => {
    expect(hostnameSchema.safeParse('bad-.com').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(hostnameSchema.safeParse('').success).toBe(false);
  });

  it('rejects empty labels (double dots)', () => {
    expect(hostnameSchema.safeParse('example..com').success).toBe(false);
  });

  it('rejects labels longer than 63 characters', () => {
    const longLabel = 'a'.repeat(64);
    expect(hostnameSchema.safeParse(longLabel).success).toBe(false);
  });

  it('rejects hostnames longer than 253 characters', () => {
    const longHostname = Array(128).fill('ab').join('.');
    expect(hostnameSchema.safeParse(longHostname).success).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(hostnameSchema.safeParse(123).success).toBe(false);
  });
});

describe('hostSchema', () => {
  it('accepts an IPv4 address', () => {
    expect(hostSchema.safeParse('192.168.0.1').success).toBe(true);
  });

  it('accepts an IPv6 address', () => {
    expect(hostSchema.safeParse('::1').success).toBe(true);
  });

  it('accepts a hostname', () => {
    expect(hostSchema.safeParse('example.com').success).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(hostSchema.safeParse('').success).toBe(false);
    expect(hostSchema.safeParse('-invalid-.host').success).toBe(false);
  });
});
