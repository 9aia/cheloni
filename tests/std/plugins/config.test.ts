import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { executeCli } from '~/core/execution/cli';
import configPlugin from '~/std/plugins/config';
import z from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('configPlugin', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cheloni-config-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('loads config file from cwd', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ key: 'value' });
      expect(context.configFile).toContain('test-cli.config');
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ key: 'value' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses custom configFile name via c12Options', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ task: 'build' });
      expect(context.configFile).toContain('tasks');
    });

    await fs.writeFile(
      path.join(tempDir, 'tasks.json'),
      JSON.stringify({ task: 'build' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({ c12Options: { configFile: 'tasks' } }),
        ],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('loads explicit config file via --config', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ explicit: true });
      expect(context.configFile).toContain('custom.config');
    });

    await fs.writeFile(
      path.join(tempDir, 'custom.config.json'),
      JSON.stringify({ explicit: true })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: ['--config', 'custom.config.json'] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('merges file config with defaults', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({
        defaultOnly: 'value',
        merged: 'file',
        fileOnly: 'value',
      });
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ merged: 'file', fileOnly: 'value' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            c12Options: { defaults: { defaultOnly: 'value', merged: 'default' } },
          }),
        ],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses defaults when no config file exists', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ fallback: 'value' });
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({ c12Options: { defaults: { fallback: 'value' } } }),
        ],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('returns empty config when no file and no defaults', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({});
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('validates config against a Zod schema', async () => {
    const schema = z.object({
      name: z.string(),
      count: z.number(),
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ name: 'test', count: 42 })
    );

    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ name: 'test', count: 42 });
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin({ schema })],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('throws when schema validation fails', async () => {
    const schema = z.object({
      name: z.string(),
      count: z.number(),
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ name: 'test', count: 'not-a-number' })
    );

    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin({ schema })],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await expect(executeCli({ cli, args: [] })).rejects.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it('validates merged config (file + defaults) against schema', async () => {
    const schema = z.object({
      name: z.string(),
      count: z.number(),
      optional: z.string().optional(),
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ name: 'test', count: 42 })
    );

    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({
        name: 'test',
        count: 42,
        optional: 'default',
      });
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            c12Options: { defaults: { optional: 'default' } },
            schema,
          }),
        ],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('prefers explicit --config over local config', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ source: 'explicit' });
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ source: 'local' })
    );
    await fs.writeFile(
      path.join(tempDir, 'explicit.config.json'),
      JSON.stringify({ source: 'explicit' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: ['--config', 'explicit.config.json'] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('applies overrides with highest priority', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config.source).toBe('override');
      expect(context.config.fileOnly).toBe('value');
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ source: 'file', fileOnly: 'value' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({ c12Options: { overrides: { source: 'override' } } }),
        ],
        command: defineCommand({ name: 'root', handler }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });
});
