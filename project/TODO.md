# TODO

- Add scaffolding tool for creating (create-cheloni, `$ cheloni init`)

- Rewrite middleware
  - Koa-like middlware uses a single, mutable ctx object passed through a middleware chain, its type is generally "static." When you add a property (like ctx.user) in one middleware, TypeScript doesn't inherently know it exists in the next one unless you manually extend the global interface or use generics.

- Global user-extendable option types, useful for programmatic CLI definition global types
- Improve option inference to include global options

- Add buildCliManifest plugin "hook" to allow plugins to modify the CLI manifest (instead of mutation using onInit that is not type-safe)
- Add test utils package
- Add and publish agent skills
- Refactor src to monorepo (3 main packages: packages/core, packages/cli, packages/create (create-cheloni))
  - Add examples/ (monorepo)
  - Ensure error handling by throwing errors instead of `process.exit(1)`
