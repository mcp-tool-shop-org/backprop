---
title: Getting Started
description: Install Backprop, run your first training job, and understand resource monitoring.
---

## Installation

Install globally from npm:

```bash
npm install -g @mcptoolshop/backprop
```

## Your first training run

### Start a run

Point Backprop at any Python training script:

```bash
backprop run train.py --name my-first-run
```

Backprop will automatically:
1. Check if your system has enough RAM and GPU VRAM
2. Start the script and track its progress
3. Gracefully shut it down after 10 minutes (the default timebox)
4. Save the run metadata and checkpoints to `~/.backprop/experiments.json`

### Extend the timebox

For longer experiments, use the `-m` flag:

```bash
backprop run train.py --name longer-run -m 30
```

This gives the run 30 minutes before the timebox triggers.

### Set GPU requirements

If your model needs a specific amount of VRAM:

```bash
backprop run train.py --name gpu-run --gpu-min-vram 4000
```

This prevents the run from starting unless at least 4GB of free VRAM is available.

## Resource monitoring

### Check system status

See your current CPU, RAM, and GPU status:

```bash
backprop status
```

This shows available resources, running experiments, and whether the system meets minimum requirements for a new run.

### How the Governor works

The Governor monitors your system **before and during** every run:

- **Pre-flight** — Checks CPU load, available RAM, and GPU VRAM/temperature. If your system is under heavy load or running hot, the run won't start.
- **During run** — Continuously monitors GPU temperature and system resources. If your GPU exceeds the max temperature (default: 85C), the run is paused until resources free up.

### GPU selection

Backprop automatically selects the GPU with the most free VRAM using `nvidia-smi`. On multi-GPU systems, it picks the best available GPU without manual configuration.

## Resuming runs

If a run is interrupted or hits its timebox, Backprop tracks the last checkpoint path. Resume with:

```bash
backprop resume <run-id>
```

Your script needs to emit checkpoint events via stdout JSON:

```json
{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}
```

Backprop picks these up automatically and stores them in the experiment record.

## Listing experiments

See all past and current experiments:

```bash
backprop list
```
