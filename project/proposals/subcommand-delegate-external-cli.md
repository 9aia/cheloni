# Declarative subcommands that run other CLIs (proposal)

## Summary

A small, declarative way to register subcommands that **spawn another program** (another CLI) instead of running an in-process handler—so one umbrella CLI can orchestrate several binaries with a single entry point and unified help.

## Motivation

Product families (e.g. Gaia) often ship **multiple CLIs** (`tarsi`, `delphis`, …). Users want one orchestrator: `gaia changelog` → `tarsi …`, `gaia codeshare` → `delphis …`, without hand-rolling `child_process` and help text for every bridge.

## Proposal

- **Delegate command** type (name + short description + target): executable path or resolved binary name, fixed prefix args, optional **passthrough** of trailing argv from the parent CLI.
- **Execution**: inherit stdio by default; propagate child exit code; optional cwd/env map.
- **Help**: subcommand appears in the tree like any other command; help text is declarative (no duplicate manual “usage” strings unless desired).

## Sketch (API shape — illustrative)

```ts
// e.g. defineCommand({ name: 'changelog', delegate: { command: 'tarsi', args: ['changelog'], passthrough: true } })
```

Exact naming (`delegate`, `spawn`, `external`) and whether this is core vs a std plugin TBD.

## Open questions

- Resolve `command` via `PATH` only vs explicit path / package bin?
- How much of parent global options (verbose, config) forward vs isolate?
- Windows / shell invocation rules (`shell: false` default)?
