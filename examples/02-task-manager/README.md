# Task Manager

A simple task management CLI demonstrating multiple commands and middleware with context sharing.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni/examples/02-task-manager
bun install
bun start [...args]
```

## Usage Examples

```bash
$ export PROJECT_NAME=my-project
$ export WORKSPACE=work
$ bun start add "Review PR" --priority high
$ bun start list
$ bun start complete 1
$ bun start delete 2
```
