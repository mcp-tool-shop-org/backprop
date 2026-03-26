---
title: Configuration
description: Configure Backprop with config files, GPU settings, and parallelism options.
sidebar:
  order: 3
---

Backprop can be configured through CLI flags, a project-level config file, or both. CLI flags always take precedence over file settings.

## Config file

Backprop looks for a config file in this order:

1. The path passed via `--config <path>`
2. `backprop.config.json` in the current working directory
3. `.backprop.json` in the current working directory

The first file found wins. If no file is found, Backprop uses built-in defaults.

### Example config file

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

## Configuration fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxRunMinutes` | number | `10` | Maximum run duration in minutes before the timebox triggers |
| `maxParallel` | number | `2` | Maximum concurrent training runs allowed |
| `gpuMemoryLimit` | string | `"80%"` | GPU memory cap as a percentage (`"80%"`) or absolute GB (`"8"`) |
| `minFreeRamGB` | number | `4` | Minimum free system RAM (in GB) required before a run starts |
| `checkpointEveryMinutes` | number | — | How often to checkpoint (passed to your training script) |
| `gpu.probe` | string | `"auto"` | GPU detection method: `"auto"`, `"nvidia-smi"`, `"rocm"`, or `"none"` |
| `gpu.minFreeVramMB` | number | `2500` | Minimum free VRAM in MB required before a run starts |
| `gpu.maxTempC` | number | `85` | Maximum GPU temperature in Celsius (run is paused if exceeded) |

## GPU configuration

### Probe types

Backprop supports three GPU detection backends:

- **`auto`** (default) — Tries `nvidia-smi` first, then falls back to `rocm-smi`. If neither is available, GPU checks are skipped.
- **`nvidia-smi`** — Uses NVIDIA's System Management Interface. Requires an NVIDIA GPU and the `nvidia-smi` binary on your PATH.
- **`rocm-smi`** — Uses AMD's ROCm System Management Interface. Requires an AMD GPU with ROCm drivers installed.
- **`none`** — Disables all GPU checks. Use this on CPU-only machines or when training without a GPU.

### Multi-GPU selection

On machines with multiple GPUs, Backprop automatically selects the GPU with the most free VRAM. No manual GPU ID configuration is needed.

### Temperature limits

The Governor monitors GPU temperature throughout the run. If the temperature exceeds `gpu.maxTempC` (default: 85C), the run is paused until the GPU cools down. A warning is logged when the temperature is within 3 degrees of the limit.

## Parallelism

The `maxParallel` setting controls how many training runs can execute simultaneously. The default is 2. The Governor enforces this limit through a token bucket that holds 4 tokens and refills at 1 token per minute.

If resource monitoring fails (e.g., OS APIs return errors), the Governor enters conservative mode where only a single run is permitted regardless of the `maxParallel` setting.

## RAM requirements

Before every run, the Governor checks that the system has at least `minFreeRamGB` of free RAM available (default: 4 GB). If memory is too low, the run is rejected with a clear error message showing the actual vs. required amount.

## Path security

Backprop validates all file paths (training scripts, checkpoint paths, resume paths) and rejects any path that contains `..` (directory traversal). This prevents accidental or malicious access to files outside the intended directories.

## Experiment storage

All experiment metadata is stored in `~/.backprop/experiments.json`. This file is written atomically (write to a temp file, then rename) to prevent corruption from crashes or power loss. If the file becomes corrupted, Backprop backs it up with a `.corrupt.<timestamp>` suffix and starts fresh.
