# Example: JSON Tool

A simple JSON tool demonstrating file I/O, JSON parsing, and subcommands for reading and writing JSON files.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni
vp install
cd examples/04-json-tool
vp run start -- [...args]
```

## Usage Examples

### Reading JSON

```bash
$ vp run start -- read data.json
$ vp run start -- read data.json --pretty
$ vp run start -- r config.json -p
```

### Writing JSON

```bash
$ vp run start -- write output.json --data '{"name": "test", "value": 42}'
$ echo '{"key": "value"}' | vp run start -- write output.json --stdin
$ vp run start -- w result.json --data '{"status": "success"}'
```
