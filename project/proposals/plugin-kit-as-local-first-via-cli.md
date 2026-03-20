$ cheloni generate plugin-kit

## Summary
Generate `plugin-kit` source code locally in the consumer repo (shadcn-style local-first) instead of publishing it as an installable package.

The CLI resolves a kit template from a registry, writes deterministic files into `src/plugin-kits/<kit-name>/`, and the user composes the generated kit via `createCli({ pluginpacks: [...] })`.

## Motivation / Problem
Package kits create versioning friction, make customization/overrides harder, slow iteration, leave users wiring boilerplate manually, and limit tree-shaking.

## Proposal
Model a `plugin-kit` as a template + metadata, then “install” it into source control.

Workflow:
1. `cheloni generate plugin-kit <kit-name>`
2. Resolve `<kit-name>` to a template from a registry (std or community)
3. Generate deterministic local files (default `src/plugin-kits/<kit-name>/`)
4. User imports the generated kit and composes it with the CLI

Upgrades are explicit (per-kit) and customization is natural because the code lives locally.

## User Experience
Interactive:
- Prompt for kit name (if omitted), output location, and included plugins/variants
- Overwrite deterministically so generation is repeatable

Non-interactive:
- `cheloni generate plugin-kit <kit-name> --output <path>`
- `cheloni generate plugin-kit <kit-name> --plugins deprecation,help,version,error-handler`

Flags override prompts (while still validating against the kit template).

## Generated Output Contract
- Named export for composition (e.g. `basicPluginKit`)
- Optional default export
- Optional metadata/manifest for updates + deprecations (e.g. `manifest.json` or `export const manifest`)

## Template / Manifest Shape
Each template includes:
- `name`
- `version` (used for upgrade prompts)
- `deprecated` (optional; warning message)
- `includes` (plugin ids for prompting/validation)
- `render`: either `codegen` (assemble plugins with std Cheloni types) or `fileTemplates` (emit templates with variables like `outputPath`, `namespace`, `plugin list`)

## Updates & Deprecation
Track the installed template version in a local manifest.

Provide upgrade support (e.g. `cheloni generate plugin-kit <kit-name> --upgrade`) that:
- fetches latest template
- shows a diff summary (files/plugins changed)
- applies updates safely (prompt before overwrite unless `--yes`)

If a template is `deprecated`, warn during generation and optionally preserve runtime deprecation behavior in generated code.

## Compatibility
Fits Cheloni’s generator/scaffolding direction: `cheloni generate` supports `plugin-kit` generation and defines local-first distribution + a standardized output contract.

## Open Questions
- Where does the kit registry live (npm/GitHub/custom endpoint)?
- Default output directory convention (`src/plugin-kits/` vs elsewhere)?
- ESM/CJS targeting rules?
- Handling breaking plugin runtime-type changes across Cheloni versions (pinning vs compatibility metadata)?
