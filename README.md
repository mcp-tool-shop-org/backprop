# Backprop

A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.

## Features

- **Timeboxed Runs**: Defaults to 10-minute runs to prevent runaway costs and resource hogging.
- **Intelligent Governor**: Monitors CPU, RAM, and GPU VRAM to ensure safe execution.
- **Auto-Resume**: Automatically resumes from the latest checkpoint if a run is interrupted.
- **Experiment Tracking**: Keeps track of all your runs, their status, and checkpoints.

## Installation

```bash
npm install -g backprop
```

## Usage

### Run a training script

```bash
backprop run train.py
```

Options:
- `-m, --max-run-minutes <minutes>`: Maximum run time in minutes (default: 10)
- `-f, --framework <type>`: Framework to use (pytorch | tensorflow | auto) (default: auto)
- `-c, --checkpoint-every-minutes <minutes>`: Checkpoint interval in minutes
- `-r, --resume-from <path>`: Path to checkpoint to resume from
- `--run-id <id>`: Unique identifier for this run
- `-n, --name <name>`: Human-readable name for this experiment

### Resume a run

```bash
backprop resume <run-id>
```

### List experiments

```bash
backprop list
```

### Check status

```bash
backprop status [run-id]
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```
