# Backlog

## Features

- Display enum values in help
- Display default values in help

- Add schema-based dynamic interactive prompting to std lib
- Add log abstraction to std lib
- Add display abstraction to std lib

- Add support for lazy loading (commands, plugins, etc.)
- Add file-based definition
  - Generate `src/manifest.gen.ts` from code (for example, `src/commands/**/*.ts` directory to automatically apply optimizations, such as code-splitting for lazy loading);
    - Files and folders for commands, e.g. "compose/stop.ts" exports default defineCommand -> "$ my-cli compose stop"

- Add pluginpack `disable` base config option to disable plugins from the pluginpack, e.g. `disable: ['auth']` to disable the `auth` plugin from the pluginpack.
- Add versioning to CLI, plugin, etc.
- Add support for config as Vite config key

## Enhancements

- Improve error messages
- Improve error handling
- Improve std config abstraction
- Add eslint plugin for cheloni
- Add prettier plugin for cheloni

## Documentation

- Add tutorial
- Add interactive examples

## DX

- Add linter and formatter to the repo
- Refactor utilities to use lodash-es
- Rewrite reference docs using a script that grabs from jsdoc comments
- Add changelog
