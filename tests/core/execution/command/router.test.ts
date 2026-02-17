import { describe, it, expect } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { findCommandByPath, resolveCommand } from '~/core/execution/command/router';

describe('findCommandByPath', () => {
  it('finds command by path', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          paths: ['t', 'test'],
          handler: async () => {},
        }),
      })
    );

    const command = findCommandByPath(cli, 't');
    expect(command).toBeDefined();
    expect(command?.manifest.name).toBe('test');
  });

  it('returns null when path not found', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          handler: async () => {},
        }),
      })
    );

    expect(findCommandByPath(cli, 'unknown')).toBeNull();
  });

  it('handles multiple commands with different paths', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: [
          defineCommand({
            name: 'cmd1',
            paths: ['a', 'alpha'],
            handler: async () => {},
          }),
          defineCommand({
            name: 'cmd2',
            paths: ['b', 'beta'],
            handler: async () => {},
          }),
        ],
      })
    );

    expect(findCommandByPath(cli, 'a')?.manifest.name).toBe('cmd1');
    expect(findCommandByPath(cli, 'beta')?.manifest.name).toBe('cmd2');
  });
});

describe('resolveCommand', () => {
  it('resolves command by path', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          paths: ['t'],
          handler: async () => {},
        }),
      })
    );

    const match = resolveCommand(cli, ['t', 'arg1']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('test');
    expect(match?.remainingArgv).toEqual(['arg1']);
  });

  it('resolves default command when no path matches', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'default',
          handler: async () => {},
        }),
      })
    );

    const match = resolveCommand(cli, ['--flag']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('default');
    expect(match?.remainingArgv).toEqual(['--flag']);
  });

  it('returns null when no commands exist', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
      })
    );

    expect(resolveCommand(cli, ['arg'])).toBeNull();
  });

  it('returns null when argv is empty', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          handler: async () => {},
        }),
      })
    );

    expect(resolveCommand(cli, [])).toBeNull();
  });

  it('returns null when path provided but not found', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'test',
          paths: ['test'],
          handler: async () => {},
        }),
      })
    );

    expect(resolveCommand(cli, ['unknown'])).toBeNull();
  });

  it('uses first command as default when no default exists', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: [
          defineCommand({
            name: 'cmd1',
            paths: ['a'],
            handler: async () => {},
          }),
          defineCommand({
            name: 'cmd2',
            paths: ['b'],
            handler: async () => {},
          }),
        ],
      })
    );

    const match = resolveCommand(cli, ['--flag']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('cmd1');
  });

  it('does not treat option-like args as commands', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'default',
          handler: async () => {},
        }),
      })
    );

    const match = resolveCommand(cli, ['--help']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('default');
  });
});
