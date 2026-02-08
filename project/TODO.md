# TODO

- Improve middleware
  - Add params `({ next, context }) => T` to middleware; add type-safety to context similar to oRPC
- Add support for lazy commands
- Built-in version command
- Add reflection (generate statically the manifest and pass it to the runtime; useful for help command or automatic docs generation)
- Built-in help command
- Generate `src/manifest.gen.ts` from code (for example, `src/commands/**/*.ts` directory to automatically load all commands from default export)
- Check global error handling
- Refactor to StandardSchema
- Add deprecated flag support to command, positional and option (via meta)

- Ensure that schema validation inside the handler is not interpreted as argument validation errors

- Add linter and formatter to the repo
- Add changelog
- Add test utils package
- Add tests
- Add and publish agent skills
