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
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cheloni-config-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('loads default config file when no explicit path provided', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ key: 'value' });
      expect(context.configFiles).toHaveLength(1);
      expect(context.configFiles[0]!.scope).toBe('local');
    });

    // Create default config file
    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ key: 'value' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses defaultFilename when provided', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ task: 'build' });
      expect(context.configFiles[0]!.path).toContain('tasks.json');
    });

    // Create custom filename config file
    await fs.writeFile(
      path.join(tempDir, 'tasks.json'),
      JSON.stringify({ task: 'build' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            defaultFilename: 'tasks.json',
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('loads explicit config file via --config option', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ explicit: true });
      expect(context.configFiles).toHaveLength(1);
      expect(context.configFiles[0]!.scope).toBe('explicit');
    });

    // Create explicit config file
    await fs.writeFile(
      path.join(tempDir, 'custom.config.json'),
      JSON.stringify({ explicit: true })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['--config', 'custom.config.json'] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('merges file config with defaultConfig', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({
        default: 'value',
        file: 'value',
        merged: 'file', // File config overrides defaultConfig
      });
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({
        default: 'value',
        merged: 'file',
        file: 'value',
      })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            defaultConfig: {
              default: 'value',
              merged: 'default',
            },
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses defaultConfig when no file exists', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ default: 'value' });
      expect(context.configFiles).toHaveLength(0);
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            defaultConfig: { default: 'value' },
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('defaults to empty object when no file and no defaultConfig', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({});
      expect(context.configFiles).toHaveLength(0);
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('validates config against schema', async () => {
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
        plugins: [
          configPlugin({
            schema,
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('throws error when schema validation fails', async () => {
    const schema = z.object({
      name: z.string(),
      count: z.number(),
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ name: 'test', count: 'invalid' })
    );

    const handler = vi.fn();

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            schema,
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await expect(executeCli({ cli, args: [] })).rejects.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it('validates merged config (file + defaultConfig) against schema', async () => {
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
            defaultConfig: { optional: 'default' },
            schema,
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('handles empty config file', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ default: 'value' });
    });

    // Create empty file
    await fs.writeFile(path.join(tempDir, 'test-cli.config.json'), '');

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            defaultConfig: { default: 'value' },
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('handles missing config file gracefully', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ default: 'value' });
      expect(context.configFiles).toHaveLength(0);
    });

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            defaultConfig: { default: 'value' },
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('falls back to defaultConfig when local file has invalid JSON', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({});
      expect(context.configFiles).toHaveLength(0);
    });

    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      '{ invalid json }'
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('uses explicit config over local when both exist', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ source: 'explicit' });
      expect(context.configFiles[0]!.scope).toBe('explicit');
    });

    // Create both local and explicit config files
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
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['--config', 'explicit.config.json'] });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses local config over global when both exist', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ source: 'local' });
      expect(context.configFiles[0]!.scope).toBe('local');
    });

    // Create local config file
    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ source: 'local' })
    );

    // Create global config directory and file
    const globalConfigDir = path.join(os.tmpdir(), 'cheloni-global-test');
    const globalConfigPath = path.join(globalConfigDir, 'test-cli', 'config.json');
    await fs.mkdir(path.dirname(globalConfigPath), { recursive: true });
    await fs.writeFile(
      globalConfigPath,
      JSON.stringify({ source: 'global' })
    );

    // Set XDG_CONFIG_HOME to point to our test directory
    const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = globalConfigDir;

    try {
      const cli = await createCli(
        defineCli({
          name: 'test-cli',
          plugins: [configPlugin()],
          command: defineCommand({
            name: 'root',
            handler,
          }),
        })
      );

      await executeCli({ cli, args: [] });
      expect(handler).toHaveBeenCalledOnce();
    } finally {
      // Restore original XDG_CONFIG_HOME
      if (originalXdgConfigHome) {
        process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      // Clean up global config
      await fs.rm(globalConfigDir, { recursive: true, force: true });
    }
  });

  it('falls back to global config when local does not exist', async () => {
    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ source: 'global' });
      expect(context.configFiles[0]!.scope).toBe('global');
    });

    // Create global config directory and file
    const globalConfigDir = path.join(os.tmpdir(), 'cheloni-global-test-2');
    const globalConfigPath = path.join(globalConfigDir, 'test-cli', 'config.json');
    await fs.mkdir(path.dirname(globalConfigPath), { recursive: true });
    await fs.writeFile(
      globalConfigPath,
      JSON.stringify({ source: 'global' })
    );

    // Set XDG_CONFIG_HOME to point to our test directory
    const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = globalConfigDir;

    try {
      const cli = await createCli(
        defineCli({
          name: 'test-cli',
          plugins: [configPlugin()],
          command: defineCommand({
            name: 'root',
            handler,
          }),
        })
      );

      await executeCli({ cli, args: [] });
      expect(handler).toHaveBeenCalledOnce();
    } finally {
      // Restore original XDG_CONFIG_HOME
      if (originalXdgConfigHome) {
        process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      // Clean up global config
      await fs.rm(globalConfigDir, { recursive: true, force: true });
    }
  });

  it('does not merge multiple config files, only uses first match', async () => {
    const handler = vi.fn(({ context }) => {
      // Should only have local config, not merged with global
      expect(context.config).toEqual({ source: 'local', key: 'local-only' });
      expect(context.configFiles).toHaveLength(1);
      expect(context.configFiles[0]!.scope).toBe('local');
    });

    // Create local config file
    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ source: 'local', key: 'local-only' })
    );

    // Create global config directory and file
    const globalConfigDir = path.join(os.tmpdir(), 'cheloni-global-test-3');
    const globalConfigPath = path.join(globalConfigDir, 'test-cli', 'config.json');
    await fs.mkdir(path.dirname(globalConfigPath), { recursive: true });
    await fs.writeFile(
      globalConfigPath,
      JSON.stringify({ source: 'global', key: 'global-only' })
    );

    // Set XDG_CONFIG_HOME to point to our test directory
    const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = globalConfigDir;

    try {
      const cli = await createCli(
        defineCli({
          name: 'test-cli',
          plugins: [configPlugin()],
          command: defineCommand({
            name: 'root',
            handler,
          }),
        })
      );

      await executeCli({ cli, args: [] });
      expect(handler).toHaveBeenCalledOnce();
    } finally {
      // Restore original XDG_CONFIG_HOME
      if (originalXdgConfigHome) {
        process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      // Clean up global config
      await fs.rm(globalConfigDir, { recursive: true, force: true });
    }
  });

  it('falls back to local when explicit file is invalid', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ source: 'local' });
      expect(context.configFiles[0]!.scope).toBe('local');
    });

    // Create invalid explicit config file
    await fs.writeFile(
      path.join(tempDir, 'invalid.config.json'),
      '{ invalid json }'
    );

    // Create valid local config file
    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ source: 'local' })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [configPlugin()],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['--config', 'invalid.config.json'] });
    expect(handler).toHaveBeenCalledOnce();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0]![0]).toContain('Warning');
    expect(consoleWarnSpy.mock.calls[0]![0]).toContain('invalid.config.json');

    consoleWarnSpy.mockRestore();
  });

  it('falls back to global when local file is invalid', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ source: 'global' });
      expect(context.configFiles[0]!.scope).toBe('global');
    });

    // Create invalid local config file
    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      '{ invalid json }'
    );

    // Create global config directory and file
    const globalConfigDir = path.join(os.tmpdir(), 'cheloni-global-test-4');
    const globalConfigPath = path.join(globalConfigDir, 'test-cli', 'config.json');
    await fs.mkdir(path.dirname(globalConfigPath), { recursive: true });
    await fs.writeFile(
      globalConfigPath,
      JSON.stringify({ source: 'global' })
    );

    // Set XDG_CONFIG_HOME to point to our test directory
    const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = globalConfigDir;

    try {
      const cli = await createCli(
        defineCli({
          name: 'test-cli',
          plugins: [configPlugin()],
          command: defineCommand({
            name: 'root',
            handler,
          }),
        })
      );

      await executeCli({ cli, args: [] });
      expect(handler).toHaveBeenCalledOnce();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]![0]).toContain('Warning');
    } finally {
      // Restore original XDG_CONFIG_HOME
      if (originalXdgConfigHome) {
        process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      // Clean up global config
      await fs.rm(globalConfigDir, { recursive: true, force: true });
      consoleWarnSpy.mockRestore();
    }
  });

  it('falls back to defaultConfig when all files are invalid', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ default: 'value' });
      expect(context.configFiles).toHaveLength(0);
    });

    // Create invalid local config file
    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      '{ invalid json }'
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            defaultConfig: { default: 'value' },
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: [] });
    expect(handler).toHaveBeenCalledOnce();
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('falls back when file fails schema validation', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const schema = z.object({
      name: z.string(),
      count: z.number(),
    });

    const handler = vi.fn(({ context }) => {
      expect(context.config).toEqual({ name: 'valid', count: 42 });
      expect(context.configFiles[0]!.scope).toBe('local');
    });

    // Create invalid explicit config file (wrong schema)
    await fs.writeFile(
      path.join(tempDir, 'invalid.config.json'),
      JSON.stringify({ name: 'test', count: 'invalid' })
    );

    // Create valid local config file
    await fs.writeFile(
      path.join(tempDir, 'test-cli.config.json'),
      JSON.stringify({ name: 'valid', count: 42 })
    );

    const cli = await createCli(
      defineCli({
        name: 'test-cli',
        plugins: [
          configPlugin({
            schema,
          }),
        ],
        command: defineCommand({
          name: 'root',
          handler,
        }),
      })
    );

    await executeCli({ cli, args: ['--config', 'invalid.config.json'] });
    expect(handler).toHaveBeenCalledOnce();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0]![0]).toContain('Warning');
    expect(consoleWarnSpy.mock.calls[0]![0]).toContain('validation');

    consoleWarnSpy.mockRestore();
  });
});
