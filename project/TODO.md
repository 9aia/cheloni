# TODO

- Release

- ---

- Add support for user-extendable middleware context type
- Add support for lazy commands and plugins
- Improve option inference to include global options
- Rewrite errors to use a single error class with code field, message, and issues
- Change globalOption to `bequeathOption`
- Ensure error handling by throwing errors instead of `process.exit(1)`
- Generate `src/manifest.gen.ts` from code (for example, `src/commands/**/*.ts` directory to automatically load all commands from default export)
- Add test utils package
- Refactor src to monorepo (3 packages: packages/core, packages/cli, packages/create (create-cheloni))
- Rewrite reference docs using a script that grabs from jsdoc comments
- Add and publish agent skills
- Add examples/ (monorepo)

- ---

- Add linter and formatter to the repo
- Add changelog
