---
title: Reference
description: Full CLI reference, configuration file, governor behavior, and security model for Backprop.
---

## Global options

These options apply to all commands:

| Flag | Description |
|------|-------------|
| `--config <path>` | Path to a custom config file |
| `--verbose` | Print resolved configuration before running |
| `--dry-run` | Simulate the run without executing |
| `--version` | Print the installed version and exit |
| `--help` | Show help for any command |

## CLI commands

### run

Start a new training run:

```bash
backprop run <script> [options]
```

| Flag | Default | Description |
|------|---------|-------------|
| `-m, --max-run-minutes` | `10` | Maximum run time in minutes |
| `-f, --framework` | `auto` | Framework: `pytorch`, `tensorflow`, or `auto` |
| `-c, --checkpoint-every-minutes` | — | Checkpoint interval in minutes |
| `-r, --resume-from` | — | Path to checkpoint to resume from |
| `-n, --name` | — | Human-readable experiment name |
| `-g, --gpu-memory-limit` | — | GPU memory limit (e.g. `"80%"` or `"8"` for GB) |
| `--gpu-min-vram` | `2500` | Minimum free VRAM in MB to start run |
| `--gpu-max-temp` | `85` | Maximum GPU temperature in Celsius |
| `-p, --max-parallel` | `2` | Maximum number of parallel runs |
| `--min-free-ram` | `4` | Minimum free RAM in GB to start run |
| `--gpu-probe` | `auto` | GPU probe type: `auto`, `nvidia-smi`, `rocm`, or `none` |
| `--run-id` | — | Unique identifier for this run |

### resume

Resume an interrupted or timeboxed run:

```bash
backprop resume <run-id>
```

Reads the last checkpoint path from the experiment record and restarts the training script from that point.

### status

Show current system resource status:

```bash
backprop status
```

Displays CPU load, available RAM, GPU VRAM, GPU temperature, and any active runs.

### list

List all experiments:

```bash
backprop list
```

Shows run IDs, names, status, duration, and checkpoint information for all recorded experiments.

## Configuration file

Create a `backprop.config.json` (or `.backprop.json`) in your project root to set defaults:

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

### Configuration fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxRunMinutes` | number | `10` | Default maximum run time in minutes |
| `maxParallel` | number | `2` | Maximum number of parallel runs allowed |
| `gpuMemoryLimit` | string | — | GPU memory cap as percentage (`"80%"`) or absolute GB (`"8"`) |
| `gpu.probe` | string | `"auto"` | GPU detection method: `"auto"`, `"nvidia-smi"`, `"rocm"`, or `"none"` |
| `gpu.minFreeVramMB` | number | `2500` | Minimum free VRAM in MB required before starting a run |
| `gpu.maxTempC` | number | `85` | Maximum allowed GPU temperature in Celsius |

CLI flags override configuration file values.

## Governor behavior

The Governor is Backprop's resource management system. It operates in two phases:

### Pre-flight checks

Before every run, the Governor verifies:

1. **CPU load** — If the system is under heavy load, the run is delayed or rejected
2. **Available RAM** — Must meet `--min-free-ram` threshold (default: 4GB)
3. **GPU availability** — Runs `nvidia-smi` (NVIDIA) or `rocm-smi` (AMD) to enumerate GPUs and their VRAM/temperature
4. **GPU VRAM** — Selected GPU must have at least `--gpu-min-vram` MB free (default: 2500)
5. **GPU temperature** — Selected GPU must be below `--gpu-max-temp` Celsius (default: 85)

If any check fails, the run does not start and a clear error message explains what is insufficient.

### Rate limiting

The Governor uses a token bucket to prevent rapid-fire run starts. It holds 4 tokens and refills 1 token per minute. Each run consumes 1 token. If you try to start runs faster than the bucket refills, the Governor rejects the request until tokens are available.

### Runtime monitoring

During a run, the Governor continues to monitor:

- **GPU temperature** — If temperature exceeds the maximum, the run is paused automatically
- **Timebox** — When the time limit is reached, Backprop sends a graceful shutdown signal

### Conservative mode

If system resource monitoring fails (e.g., OS APIs return errors), the Governor enters conservative mode. In this mode, only single-run execution is allowed (`maxParallel` must be 1). This prevents accidental resource exhaustion when the Governor cannot verify system state.

### GPU selection

On systems with multiple NVIDIA GPUs, the Governor automatically selects the GPU with the most free VRAM. This happens transparently — no manual GPU ID configuration is needed.

If neither `nvidia-smi` nor `rocm-smi` is available (e.g., on CPU-only machines), set `--gpu-probe none` to disable GPU checks entirely.

## Checkpoint protocol

For automatic resume support, your training script should emit JSON events to stdout:

```json
{"event": "checkpoint_saved", "path": "/path/to/checkpoint.pt"}
```

Backprop captures these events and stores the checkpoint path in `~/.backprop/experiments.json`. When you run `backprop resume <run-id>`, it passes the checkpoint path back to your script via `--resume-from`.

## Experiment storage

All experiment metadata is stored in `~/.backprop/experiments.json`. Each experiment record includes:

- Run ID and name
- Script path and arguments
- Start time, end time, and duration
- Status (running, completed, timeboxed, failed)
- Checkpoint paths
- GPU and resource information at start time

## Security model

Backprop operates entirely locally with no network access.

| Aspect | Detail |
|--------|--------|
| **Data accessed** | `backprop.config.json` for configuration. Spawns Python training processes. Monitors system resources via `nvidia-smi`. Writes experiment metadata to `~/.backprop/`. |
| **Data NOT accessed** | No network requests. No telemetry. No credential storage. Training data stays local — Backprop orchestrates processes, it does not read training datasets. |
| **Permissions** | File system access for configuration, experiment logs, and lockfiles. Process spawning for Python training scripts. |
| **Network** | None. No outbound connections of any kind. |
| **Telemetry** | None collected or sent. |

See [SECURITY.md](https://github.com/mcp-tool-shop-org/backprop/blob/main/SECURITY.md) for vulnerability reporting.
