# Backlog

## Features

- Display enum values in help
- Display default values in help
- Add name to positional arguments schema meta to display in help

- Add schema-based dynamic interactive prompting to std lib
- Add log abstraction to std lib
- Add display abstraction to std lib

- Add support for lazy loading (commands, plugins, etc.)
- Add file-based definition
  - Generate `src/manifest.gen.ts` from code (for example, `src/commands/**/*.ts` directory to automatically apply optimizations, such as code-splitting for lazy loading);
    - Files and folders for commands, e.g. "compose/stop.ts" exports default defineCommand -> "$ my-cli compose stop"

- Add pluginpack config
  - Add pluginpack `exclude` base config option to exclude plugins from the pluginpack, e.g. `exclude: ['auth']` to exclude the `auth` plugin from the pluginpack.

- Add versioning to CLI, plugin, etc.
- Add support for config as Vite config key

## Enhancements

- Improve error handling
- Improve std config abstraction

## Documentation

- Add tutorial
- Add interactive examples

## DX

- Add linter and formatter to the repo
- Refactor utilities to use lodash-es
- Rewrite reference docs using a script that grabs from jsdoc comments
- Add changelog
- Move the KeyedSet to its own package in another repository
