# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-21

### Added
- **CLI-First ML Trainer**: Core `backprop` CLI with `run`, `resume`, `list`, and `status` commands.
- **Intelligent Governor**: Resource monitoring (CPU, RAM, GPU VRAM, Temp) with token bucket rate limiting and graceful cooldowns.
- **Timeboxing**: Default 10-minute runs with graceful shutdown (SIGINT) and force kill (SIGKILL) fallbacks.
- **Auto-Resume**: Automatically resumes from the latest checkpoint if a run is interrupted.
- **Experiment Tracking**: Local JSON-based store (`~/.backprop/experiments.json`) to track run metadata and checkpoints.
- **Configuration System**: Load settings from `backprop.config.json`, `.backprop.json`, or CLI flags.
- **Docker Support**: Lightweight Dockerfile based on Node 22 and Python.
- **CI/CD**: GitHub Actions workflow for testing and building on push.
- **Beautiful UI**: Integrated `ora` spinners for clean, professional terminal output during training.
