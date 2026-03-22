# Task Manager

A simple task management CLI demonstrating multiple commands and middleware with context sharing.

## Quick Start

```bash
git clone https://github.com/9aia/cheloni.git
cd cheloni
vp install
cd examples/02-task-manager
vp run start -- [...args]
```

## Usage Examples

```bash
$ export PROJECT_NAME=my-project
$ export WORKSPACE=work
$ vp run start -- add "Review PR" --priority high
$ vp run start -- list
$ vp run start -- complete 1
$ vp run start -- delete 2
```
