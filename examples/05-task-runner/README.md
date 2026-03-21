# Task Runner

A lightweight task runner demonstrating the std config plugin, positional arguments, and accessing configuration in handlers. Plugins are composed with a local **plugin kit** array (same pattern as [`src/cli.ts`](./src/cli.ts)).

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/05-task-runner
bun install
bun start [...args]
```

## Usage Examples

```bash
# Using explicit config file
$ bun start build --config tasks.dev.json
Running task: build
Command: tsc
✓ Task "build" completed

# Using default config file (tasks.json)
$ bun start start
Running task: start
Command: node dist/app.js
✓ Task "start" completed

# Error handling
$ bun start unknown
Task "unknown" not found in tasks.json
Available tasks: build, start, test, lint
```
