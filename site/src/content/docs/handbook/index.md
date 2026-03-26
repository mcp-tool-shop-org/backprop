---
title: Backprop Handbook
description: Complete guide to CLI-first ML training with intelligent resource governance.
---

Welcome to the **Backprop** handbook. This guide covers everything you need to run safe, timeboxed ML training with automatic resource monitoring.

## Contents

- [Getting Started](./getting-started/) — Installation, your first training run, and resource monitoring
- [Configuration](./configuration/) — Config files, GPU settings, and parallelism
- [Reference](./reference/) — CLI commands, configuration file, governor behavior, and security model
- [For Beginners](./beginners/) — New to ML training? Start here

## What is Backprop?

Backprop is a CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance. Instead of launching a training script and hoping it finishes after 48 hours, Backprop encourages **timeboxed runs** with automatic checkpoint tracking and resume support.

### Key principles

- **Short by default** — 10-minute timebox prevents runaway jobs and overnight surprises
- **Resource-aware** — The Governor checks CPU, RAM, GPU VRAM, and temperature before and during every run
- **Resumable** — Checkpoint paths are tracked automatically. Resume any interrupted run with a single command
- **GPU-intelligent** — Uses `nvidia-smi` (NVIDIA) or `rocm-smi` (AMD) to select the GPU with the most free VRAM and monitors temperature throughout

### How it works

1. You run `backprop run train.py`
2. The Governor checks your system has enough RAM and GPU VRAM
3. Your script starts and Backprop tracks its progress
4. After 10 minutes (configurable), Backprop gracefully shuts it down
5. Run metadata and checkpoints are saved to `~/.backprop/experiments.json`
6. Resume anytime with `backprop resume <run-id>`
