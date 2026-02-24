# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-23

### Added
- **Configurable minimum free RAM**: New `--min-free-ram <gb>` CLI flag and `minFreeRamGB` config option (default: 4 GB).
- **Script existence check**: Validates training script exists before spawning Python process.
- **Path traversal protection**: Zod schema rejects `..` in `trainingScriptPath` and `resumeFrom`.
- **File locking**: ExperimentStore uses exclusive lockfile to prevent concurrent write corruption.
- **NaN-safe GPU parsing**: nvidia-smi probe skips malformed rows instead of propagating NaN values.
- **.dockerignore**: Excludes non-runtime files from Docker builds.

### Fixed
- **Windows CPU monitoring**: `os.loadavg()` returns `[0,0,0]` on Windows — now computes CPU load from `os.cpus()` times.
- **GPU temperature warning**: Warning threshold is now relative to `maxTempC` (limit - 3) instead of hardcoded 82°C.
- **Resume parallelism**: `backprop resume` now uses configured `maxParallel` instead of hardcoded 1.
- **Type safety**: Replaced `any` types in CLI command handlers with `Partial<Config>`.

### Security
- **Release workflow**: Added concurrency group to prevent overlapping npm publishes.

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
