# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-02-21

### Fixed
- **README**: Removed redundant text header below the logo.

## [0.1.1] - 2026-02-21

### Added
- **Branding**: Added the official Backprop logo to the README and package.

## [0.1.0] - 2026-02-21

### Added
- **Timeboxed Runs**: Defaults to 10-minute runs to prevent runaway costs and resource hogging.
- **Intelligent Governor**: Monitors CPU, RAM, and GPU VRAM (via `nvidia-smi`) to ensure safe execution.
- **Auto-Resume**: Automatically resumes from the latest checkpoint if a run is interrupted.
- **Experiment Tracking**: Keeps track of all your runs, their status, and checkpoints.
- **Docker Support**: Lightweight container for isolated training runs.
- **CLI-First ML Trainer**: Core `backprop` CLI with `run`, `resume`, `list`, and `status` commands.
- **Configuration System**: Load settings from `backprop.config.json`, `.backprop.json`, or CLI flags.
- **CI/CD**: GitHub Actions workflow for testing and building on push.
- **Beautiful UI**: Integrated `ora` spinners for clean, professional terminal output during training.
