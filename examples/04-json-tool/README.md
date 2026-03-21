# Example: JSON Tool

A simple JSON tool demonstrating file I/O, JSON parsing, and subcommands for reading and writing JSON files.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/04-json-tool
bun install
bun start [...args]
```

## Usage Examples

### Reading JSON

```bash
$ bun start read data.json
$ bun start read data.json --pretty
$ bun start r config.json -p
```

### Writing JSON

```bash
$ bun start write output.json --data '{"name": "test", "value": 42}'
$ echo '{"key": "value"}' | bun start write output.json --stdin
$ bun start w result.json --data '{"status": "success"}'
```
