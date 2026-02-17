import { describe, it, expect } from 'vitest';
import { defineCli } from '~/core/definition/cli';
import { defineCommand } from '~/core/definition/command';
import { createCli } from '~/core/creation/cli';
import { createCommand } from '~/core/creation/command';
import { findCommandByPath, resolveCommand } from '~/core/execution/command/router';

describe('findCommandByPath', () => {
  it('finds command by path', () => {
    const cmd = createCommand(defineCommand({
      name: 'test',
      paths: ['t', 'test'],
      handler: async () => {},
    }));

    const found = findCommandByPath([cmd], 't');
    expect(found).toBeDefined();
    expect(found?.manifest.name).toBe('test');
  });

  it('returns null when path not found', () => {
    const cmd = createCommand(defineCommand({
      name: 'test',
      paths: ['test'],
      handler: async () => {},
    }));

    expect(findCommandByPath([cmd], 'unknown')).toBeNull();
  });

  it('handles multiple commands with different paths', () => {
    const cmd1 = createCommand(defineCommand({
      name: 'cmd1',
      paths: ['a', 'alpha'],
      handler: async () => {},
    }));
    const cmd2 = createCommand(defineCommand({
      name: 'cmd2',
      paths: ['b', 'beta'],
      handler: async () => {},
    }));

    expect(findCommandByPath([cmd1, cmd2], 'a')?.manifest.name).toBe('cmd1');
    expect(findCommandByPath([cmd1, cmd2], 'beta')?.manifest.name).toBe('cmd2');
  });
});

describe('resolveCommand', () => {
  it('resolves to root command when no args', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const match = resolveCommand(cli, []);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('root');
    expect(match?.remainingArgv).toEqual([]);
  });

  it('resolves nested subcommand by path', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          command: defineCommand({
            name: 'sub',
            paths: ['s', 'sub'],
            handler: async () => {},
          }),
          handler: async () => {},
        }),
      })
    );

    const match = resolveCommand(cli, ['s', 'arg1']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('sub');
    expect(match?.remainingArgv).toEqual(['arg1']);
  });

  it('resolves root command when arg is an option', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const match = resolveCommand(cli, ['--flag']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('root');
    expect(match?.remainingArgv).toEqual(['--flag']);
  });

  it('returns null when no root command', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
      })
    );

    expect(resolveCommand(cli, ['arg'])).toBeNull();
  });

  it('stays at root when no matching subcommand', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          command: defineCommand({
            name: 'known',
            paths: ['known'],
            handler: async () => {},
          }),
          handler: async () => {},
        }),
      })
    );

    // "unknown" doesn't match any subcommand, so it stays at root
    const match = resolveCommand(cli, ['unknown']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('root');
    expect(match?.remainingArgv).toEqual(['unknown']);
  });

  it('resolves deeply nested commands', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          command: defineCommand({
            name: 'level1',
            paths: ['l1'],
            command: defineCommand({
              name: 'level2',
              paths: ['l2'],
              handler: async () => {},
            }),
          }),
        }),
      })
    );

    const match = resolveCommand(cli, ['l1', 'l2', '--flag']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('level2');
    expect(match?.remainingArgv).toEqual(['--flag']);
  });

  it('does not treat option-like args as commands', async () => {
    const cli = await createCli(
      defineCli({
        name: 'test',
        command: defineCommand({
          name: 'root',
          handler: async () => {},
        }),
      })
    );

    const match = resolveCommand(cli, ['--help']);
    expect(match).toBeDefined();
    expect(match?.command.manifest.name).toBe('root');
  });
});
