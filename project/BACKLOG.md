# Backlog

## Features

- Display enum values in help
- Display default values in help
- Add support for config as Vite config key

- Add UI/display abstraction to std lib
  - Add schema-based dynamic interactive prompting to std lib
- Add log abstraction to std lib

- Add support for lazy loading (commands, plugins, etc.)
- Add file-based definition
  - Generate `src/manifest.gen.ts` from code (for example, `src/commands/**/*.ts` directory to automatically apply optimizations, such as code-splitting for lazy loading);
    - Files and folders for commands, e.g. "compose/stop.ts" exports default defineCommand -> "$ my-cli compose stop"

- Add versioning to CLI, plugin, etc.

- Abstract schema validation (decouple core from zod and turn zod into a plugin)
- Add a easy declarative way to define subcommands to run other CLIs.

## Enhancements

- Improve error messages
- Improve error handling
- Create eslint-plugin-cheloni
- Create prettier-plugin-cheloni

## Documentation

- Add tutorial
- Add interactive examples

## DX

- Add linter and formatter to the repo
- Refactor utilities to use lodash-es if applicable
- Rewrite reference docs using a script that grabs from jsdoc comments
- Add changelog
