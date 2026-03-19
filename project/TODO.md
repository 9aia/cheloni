# TODO

- Ensure error handling by throwing errors instead of `process.exit(1)`
- Improve deprecation warnings by decoupling from core to std
- Add scaffolding tool for creating (create-cheloni, `$ cheloni init`)
- Add shell completion plugin

- Add dependencies for commands, so it can inherit types

- Global user-extendable option types, useful for programmatic CLI definition global types
- Improve option inference to include global options

- Add option(schema, meta), positional(schema, meta)
- Add pluginpack config (disable/enable plugins, change config for each plugin)
- Add validation to definition to ensure that the definition is valid
- Add variadics

- Add buildCliManifest plugin "hook" to allow plugins to modify the CLI manifest (instead of mutation using onInit that is not type-safe)
- Add test utils package
- Add and publish agent skills
- Refactor src to monorepo (3 main packages: packages/core, packages/cli, packages/create (create-cheloni))
  - Add examples/ (monorepo)
- Refactor config plugin to use c12

- Improve instrumentation
