# Backprop

A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.

## Features

- **Timeboxed Runs**: Defaults to 10-minute runs to prevent runaway costs and resource hogging.
- **Intelligent Governor**: Monitors CPU, RAM, and GPU VRAM to ensure safe execution.
- **Auto-Resume**: Automatically resumes from the latest checkpoint if a run is interrupted.
- **Experiment Tracking**: Keeps track of all your runs, their status, and checkpoints.

## Getting Started

### 1. Installation

```bash
npm install -g backprop
```

### 2. Prepare your Python script

Your Python script should output JSONL (JSON Lines) to `stdout` for progress tracking.

```python
# train.py
import json
import time

for step in range(1, 101):
    # Simulate training
    time.sleep(1)
    
    # Report progress
    print(json.dumps({"step": step, "loss": 1.0 / step}), flush=True)
    
    # Report checkpoints
    if step % 10 == 0:
        print(json.dumps({"event": "checkpoint_saved", "path": f"/tmp/ckpt-{step}.pt"}), flush=True)
```

### 3. Run it safely

```bash
backprop run train.py --name "My First Experiment"
```

Backprop will automatically:
1. Check if your system has enough RAM/GPU resources.
2. Start the script and track its progress.
3. Gracefully shut it down after 10 minutes (configurable via `-m`).
4. Save the run metadata and checkpoints to `~/.backprop/experiments.json`.

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
- `-g, --gpu-memory-limit <limit>`: GPU memory limit (e.g., "80%" or "8" for GB)
- `-p, --max-parallel <count>`: Maximum parallel runs
- `--gpu-probe <type>`: GPU probe type (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: Minimum free VRAM in MB to start run (default: 2500)
- `--gpu-max-temp <c>`: Maximum GPU temperature in Celsius (default: 85)

### Configuration File

You can create a `backprop.config.json` in your project root:

```json
{
  "maxRunMinutes": 30,
  "maxParallel": 2,
  "gpuMemoryLimit": "80%",
  "gpu": {
    "probe": "auto",
    "minFreeVramMB": 2500,
    "maxTempC": 85
  }
}
```

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
