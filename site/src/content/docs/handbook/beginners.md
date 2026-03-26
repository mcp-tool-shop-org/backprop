---
title: For Beginners
description: New to backprop? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

Backprop is a command-line tool that runs your machine learning training scripts safely. Instead of launching a training job and hoping it finishes after many hours, Backprop keeps each run short (10 minutes by default), watches your computer's resources (CPU, RAM, GPU), and saves progress automatically so you can pick up where you left off.

Think of it as a safety net for training: it prevents your GPU from overheating, stops runs before they eat all your memory, and remembers checkpoints so interrupted work is never lost.

## Who is this for?

Backprop is built for:

- **ML practitioners** who train models locally and want guardrails against runaway jobs
- **Students and hobbyists** learning ML who want to iterate safely without risking their hardware
- **Researchers** running experiments on shared workstations who need resource-aware scheduling
- **Anyone with a GPU** who has lost training progress to crashes, overheating, or accidental terminal closures

You do not need to be an expert. If you can write a Python training script, Backprop can manage it.

## Prerequisites

Before using Backprop, make sure you have:

- **Node.js 18 or later** — Backprop is installed via npm. Check with `node --version`.
- **Python** — Your training scripts need Python available on your PATH. Check with `python --version`.
- **A training script** — Any Python script that trains a model. Backprop runs it as a subprocess.
- **(Optional) NVIDIA GPU with `nvidia-smi`** — Required for GPU monitoring on NVIDIA hardware. Comes with NVIDIA drivers.
- **(Optional) AMD GPU with `rocm-smi`** — Required for GPU monitoring on AMD hardware. Comes with ROCm drivers.

If you do not have a GPU, set `--gpu-probe none` and Backprop will skip GPU checks entirely.

## Your First 5 Minutes

### Step 1: Install Backprop

```bash
npm install -g @mcptoolshop/backprop
```

Verify the install:

```bash
backprop --version
```

### Step 2: Check your system

See if your machine meets the requirements:

```bash
backprop status
```

This shows your CPU load, free RAM, GPU VRAM, and GPU temperature. If anything looks low, you know before you start.

### Step 3: Create a training script

If you do not have one yet, create a simple test script called `train.py`:

```python
import json, time

for step in range(100):
    loss = 1.0 / (step + 1)
    print(json.dumps({"step": step, "loss": loss}), flush=True)
    time.sleep(1)
```

This script emits JSON progress lines that Backprop can track.

### Step 4: Run it

```bash
backprop run train.py --name my-first-run
```

You will see a spinner showing live step and loss progress. After 10 minutes (or when the script finishes), Backprop saves the run.

### Step 5: Check your results

```bash
backprop list
```

This shows all your experiments with their status, duration, step count, and loss.

## Common Mistakes

**1. Forgetting to output JSON progress lines.**
Backprop tracks training progress by reading JSON from stdout. If your script prints plain text instead, Backprop still runs it but cannot display step or loss information. Format your output as `{"step": N, "loss": X}`.

**2. Running without Python on PATH.**
Backprop spawns `python` as a subprocess. If Python is not on your PATH (common on Windows where it might be `python3` or installed in a virtual environment), the run fails immediately. Activate your virtual environment first, or ensure `python` resolves correctly.

**3. Setting GPU thresholds too tight.**
If you set `--gpu-min-vram` higher than your GPU's total VRAM, every run is rejected. Start with the defaults (2500 MB minimum VRAM, 85C max temperature) and adjust only if needed.

**4. Not emitting checkpoint events for resume.**
If your script does not output `{"event": "checkpoint_saved", "path": "/path/to/ckpt"}` lines, Backprop cannot resume interrupted runs. Without checkpoints, `backprop resume` has nothing to work with.

**5. Editing `experiments.json` by hand.**
The experiment database at `~/.backprop/experiments.json` is managed by Backprop with atomic writes. Editing it manually while a run is active risks data corruption.

## Next Steps

- [Getting Started](./getting-started/) — Detailed installation, GPU configuration, and resume workflow
- [Configuration](./configuration/) — Config files, GPU probe types, and parallelism settings
- [Reference](./reference/) — Full CLI flag reference, Governor behavior, and security model

## Glossary

| Term | Definition |
|------|------------|
| **Governor** | The resource management system inside Backprop that checks CPU, RAM, and GPU state before and during runs |
| **Timebox** | A maximum duration for a training run (default: 10 minutes). When the timebox expires, Backprop sends a graceful shutdown signal |
| **Checkpoint** | A saved snapshot of model state during training, allowing the run to resume from that point |
| **Token bucket** | A rate limiter that prevents rapid-fire run starts. Holds 4 tokens, refills 1 per minute |
| **VRAM** | Video RAM on your GPU, used to hold model weights and training data during GPU-accelerated training |
| **nvidia-smi** | NVIDIA System Management Interface, a command-line tool that reports GPU status (VRAM, temperature, utilization) |
| **rocm-smi** | AMD ROCm System Management Interface, the AMD equivalent of nvidia-smi |
| **Experiment** | A recorded training run in Backprop's database, including its ID, name, status, checkpoints, and metrics |
| **Conservative mode** | A fallback mode the Governor enters when resource monitoring fails, restricting execution to one run at a time |
| **Atomic write** | A file write strategy where data is written to a temporary file then renamed, preventing corruption from crashes |
