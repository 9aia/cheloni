# Cheloni Core Architecture

## Overview

Cheloni is a CLI framework with a layered architecture separating **Definition**, **Manifest**, **Creation**, and **Execution** concerns.

## Architecture Layers

### 1. Definition Layer (`core/definition/`)
**Purpose**: User-facing API for defining CLI structure

- **`cli.ts`**: CLI structure (name, version, commands, global options, plugins)
- **`command/`**: Command definitions (name, paths, positional, options, middleware, handler, plugin)
- **`plugin.ts`**: Plugin definitions with lifecycle hooks

**Key Types**:
- `CliDefinition`: Root CLI configuration
- `CommandDefinition<TPositional, TOptions>`: Command with Zod schemas
- `OptionDefinition`: Zod schema for options
- `PositionalDefinition`: Zod schema for positional args
- `PluginDefinition`: Plugin with `onInit`, `onBeforeCommand`, `onAfterCommand`, `onDestroy` hooks

### 2. Manifest Layer (`core/manifest/`)
**Purpose**: Extract metadata from definitions for introspection/help generation

- **`cli.ts`**: CLI metadata (name, version, commands, global options)
- **`command/`**: Command metadata (options, positional, descriptions, aliases)
- **`plugin.ts`**: Plugin metadata

**Key Functions**:
- `getCliManifest()`: Extract CLI metadata
- `getCommandManifest()`: Extract command metadata
- `getOptionsManifest()`: Extract option metadata with aliases
- `getPositionalManifest()`: Extract positional metadata

### 3. Creation Layer (`core/creation/`)
**Purpose**: Build runtime objects from definitions

- **`cli.ts`**: Creates `Cli` instances, applies plugin `onInit` hooks
- **`command/`**: Creates `Command` instances with handler, manifest, schema
- **`plugin/`**: Creates `Plugin` instances

**Key Types**:
- `Cli`: Runtime CLI with rootCommands, globalOptions, plugins
- `Command`: Runtime command with definition, manifest, paths, deprecated flag
- `CommandHandler`: Function receiving parsed args and executing logic

### 4. Execution Layer (`core/execution/`)
**Purpose**: Execute commands at runtime

- **`cli.ts`**: CLI execution entry point (`executeCli()`), resolves command, handles deprecation warnings, calls `onDestroy` hooks
- **`command/`**: Command execution logic
  - **`index.ts`**: Main execution flow (parse, validate, middleware, global options, handler, plugin hooks)
  - **`router.ts`**: Command routing (`resolveCommand()`, `findCommandByPath()`)
  - **`middleware.ts`**: Middleware chain execution (sequential, shared data)
  - **`validate.ts`**: Option validation (extrageous options handling, global option awareness)
  - **`handle-error.ts`**: Error handling and formatting (structured validation errors)
  - **`errors.ts`**: Error types (`InvalidOptionsError`, `InvalidPositionalError`)
- **`parser/`**: Argument parsing (mri-based, extracts positional + options with alias support)
- **`cli/help.ts`**: Help text generation

**Key Functions**:
- `executeCli()`: Main entry point, resolves command, handles errors, calls `onDestroy` hooks
- `resolveCommand()`: Find command from argv (by path or default command)
- `executeCommand()`: Parse args → middleware → validate → global option handlers → plugin hooks → handler
- `parseArgs()`: Parse argv into positional + options using mri with alias map

## Data Flow

```
User Input (argv)
    ↓
executeCli(): resolveCommand() → find command
    ↓
executeCommand():
  - Build alias map (command + global options)
  - parseArgs() → extract positional + options
  - executeMiddleware() → run middleware chain
  - validateOptionsExist() → check extrageous options
  - Extract/validate positional (with deprecation warnings)
  - Validate options with Zod (with deprecation warnings)
  - Execute global option handlers (may exit early)
  - Plugin.onBeforeCommand hooks
  - Execute handler
  - Plugin.onAfterCommand hooks (even on error)
    ↓
executeCli(): Plugin.onDestroy hooks (in finally)
```

## Type System

- **Definition Types**: User-provided Zod schemas
- **Manifest Types**: Metadata extracted from definitions
- **Creation Types**: Runtime objects with inferred types from Zod
- **Execution Types**: Parsed/validated runtime values

## Key Concepts

### Commands
- **Paths**: Aliases for command names (e.g., `["h", "help"]`)
- **Default Command**: Command without paths (executed when no path matches)
- **Positional**: Single positional argument (Zod schema)
- **Options**: Named options (Zod object schema)
- **Middleware**: Pre-handler execution chain (sequential, shared data)
- **Handler**: Main command logic
- **Deprecated**: Boolean or string message for deprecation warnings

### Global Options
- Available to all commands
- Defined globally with handlers (can exit early, e.g., help/version)
- Validated separately from command options
- Always considered valid during option validation
- Merged into alias map for parsing

### Plugins
- Lifecycle hooks: `onInit` (CLI creation), `onBeforeCommand`, `onAfterCommand`, `onDestroy` (CLI teardown)
- Can modify CLI structure during `onInit`
- Applied globally or per-command
- `onAfterCommand` always called (even if handler throws)
- `onDestroy` called in finally block (always executes)

### Validation
- **Extrageous Options**: Configurable behavior (`throw`, `filter-out`, `pass-through`)
- **Zod Validation**: Options and positional validated against schemas
- **Global Options**: Always valid, excluded from extrageous checks
- **Deprecation Warnings**: Shown for CLI, commands, options, and positional args
- **Error Handling**: Structured errors (`InvalidOptionsError`, `InvalidPositionalError`) with field descriptions

## File Structure

```
core/
├── definition/     # User API (what they define)
├── manifest/       # Metadata extraction (for help/introspection)
├── creation/       # Runtime object creation
└── execution/      # Runtime execution logic
```
