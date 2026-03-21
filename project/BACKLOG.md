# Backlog

## Features

- Display enum values in help
- Display default values in help
- Add support for config as Vite config key

- Add UI/display abstraction to std lib
  - Add schema-based dynamic interactive prompting to std lib
- Add log abstraction to std lib and add logger plugin

- Add support for lazy loading (commands, plugins, etc.)
- Add file-based definition
  - Generate `src/manifest.gen.ts` from code (for example, `src/commands/**/*.ts` directory to automatically apply optimizations, such as code-splitting for lazy loading);
    - Files and folders for commands, e.g. "compose/stop.ts" exports default defineCommand -> "$ my-cli compose stop"

- Add versioning to CLI, plugin, etc.

- Abstract schema validation (decouple core from zod and turn zod into a plugin)
- Add a easy declarative way to define subcommands to run other CLIs.

- Add test utils package
- Add and publish agent skills

- Add support for config caching (avoid reloading the config file for subcommands that also use the config)
- Add support for controlling when the config is loaded (eagerly or lazily)?

## Enhancements

- Improve error messages
- Improve error handling
- Create eslint-plugin-cheloni
- Create prettier-plugin-cheloni

## Documentation

- Add tutorial
- Move example docgen to an external tool
- Add interactive examples

## DX

- Refactor plugins to use immerjs
- Refactor read nearest package.json using an external library
- Add linter and formatter to the repo
- Refactor utilities to use lodash-es if applicable
- Rewrite reference docs using a script that grabs from jsdoc comments
- Add changelog
