<p align="center">
  <img src="./logo.svg" alt="Backprop Logo" width="250" />
</p>

<h1 align="center">Backprop</h1>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

## Getting Started

### 1. Install

```bash
npm install -g @mcptoolshop/backprop
```

### 2. Run a Training Script

```bash
backprop run train.py --name my-first-run
```

That's it. Backprop will automatically:
1. Check if your system has enough RAM and GPU VRAM.
2. Start the script and track its progress.
3. Gracefully shut it down after 10 minutes (configurable via `-m`).
4. Save the run metadata and checkpoints to `~/.backprop/experiments.json`.

## How It Works

### The Governor
Backprop includes an intelligent Governor that monitors your system resources before and during a run. It checks CPU load, available RAM, and GPU VRAM/Temperature (via `nvidia-smi`). If your system is under heavy load or running too hot, the Governor will prevent the run from starting or pause it until resources free up.

### Short Runs + Auto-Resume
Instead of running a script for 48 hours straight and praying it doesn't crash, Backprop encourages **timeboxed runs**. By default, runs are limited to 10 minutes. 

If your script outputs checkpoint paths (e.g., `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop remembers them. You can easily resume an interrupted or timeboxed run:

```bash
backprop resume <run-id>
```

### Resource Monitoring
Backprop uses `nvidia-smi` to accurately monitor NVIDIA GPUs. It automatically selects the GPU with the most free VRAM and ensures it meets your minimum requirements before starting a run.

You can check your system's current resource status at any time:

```bash
backprop status
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

### List experiments

```bash
backprop list
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```
