# Example: Benchmark

A benchmark tool demonstrating bequeath options (`--verbose`), a positional argument (the command to run), and a custom timing plugin.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni
vp install
cd examples/03-benchmark
vp run start -- [...args]
```

## Usage Examples

```bash
$ vp run start -- run "npm test"
⏱️  127ms

$ vp run start -- run "npm test" --verbose
Running: npm test
Iterations: 1
✓ npm test completed
All iterations completed

⏱️  Command executed in 142ms

$ vp run start -- run "npm test" --iterations 3 --verbose
Running: npm test
Iterations: 3

Iteration 1/3:
✓ npm test completed

Iteration 2/3:
✓ npm test completed

Iteration 3/3:
✓ npm test completed

All iterations completed

⏱️  Command executed in 387ms
```
