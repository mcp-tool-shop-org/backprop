# Backprop for VS Code

Run, monitor, and manage concurrent ML training runs directly from your editor. Backprop is a CLI-first trainer with intelligent resource governance — this extension brings the full multirun workflow into VS Code.

## Features

### Concurrent Training Runs

Each training run launches in its own dedicated terminal. Run multiple experiments in parallel — the Governor's token bucket and resource monitoring ensure your machine stays healthy.

- **Quick run**: Click the play button on any Python file
- **Configured run**: Click the gear icon to set experiment name, timeout, and framework before launching
- Every run gets a unique terminal (`Backprop: train #1`, `Backprop: train #2`, etc.)

### Experiment Tree View

Browse all your training experiments in the Backprop sidebar. Each run is expandable to show full details:

- **Status icons**: green check (completed), red error (failed), spinning sync (running), clock (timeboxed)
- **Expand any run** to see: ID, script, duration, steps, loss, checkpoint count, timestamps
- **Auto-refreshes** when experiments.json changes on disk — no manual refresh needed
- **Right-click context menus** with actions based on run status

### Run Management

- **Stop**: Right-click a running experiment and select "Stop Run" — sends SIGINT for graceful shutdown
- **Resume**: Right-click a completed/failed/timeboxed experiment and select "Resume Run" — prompts for new timeout
- **Show Terminal**: Jump to a running experiment's terminal output

Inline action buttons appear directly on tree items:
- Running experiments show stop and terminal buttons
- Stopped experiments show a resume button

### GPU Status Bar

A persistent status bar item shows current GPU VRAM and temperature, refreshing every 30 seconds. Click it to launch a configured run.

## Keyboard Shortcuts

| Shortcut | Command | When |
|----------|---------|------|
| `Ctrl+Alt+R` (`Cmd+Alt+R` on Mac) | Run with Backprop | Python file is active |
| `Ctrl+Alt+Shift+R` (`Cmd+Alt+Shift+R` on Mac) | Run with Backprop (Configure...) | Python file is active |
| `Ctrl+Alt+S` (`Cmd+Alt+S` on Mac) | Stop Run | Always |

All keybindings can be customized in VS Code's Keyboard Shortcuts editor (`Ctrl+K Ctrl+S`).

## Requirements

- **Backprop CLI** must be installed globally:
  ```
  npm install -g @mcptoolshop/backprop
  ```
- Python 3.x for training scripts

The extension checks for the CLI on activation and offers to install it if missing.

## Commands

| Command | Description | Where |
|---------|-------------|-------|
| `Run with Backprop` | Quick-launch the active Python file | Editor title bar, Command Palette |
| `Run with Backprop (Configure...)` | Launch with name/timeout/framework prompts | Editor title bar, Command Palette, Status bar click |
| `Resume Run` | Resume a stopped experiment | Tree view context menu |
| `Stop Run` | Send SIGINT to a running experiment | Tree view context menu + inline |
| `Show Terminal` | Focus a running experiment's terminal | Tree view context menu + inline |
| `Refresh Experiments` | Manually reload the experiment list | Tree view title bar |

## Extension Settings

This extension does not add any VS Code settings. All training configuration is handled through the Backprop CLI config file (`.backprop.json`). Run `backprop init` in your project to generate one.

## Troubleshooting

**"Backprop CLI is not installed"**
The extension requires the CLI to be installed globally. Run `npm install -g @mcptoolshop/backprop` and reload the window.

**No experiments in the sidebar**
Experiments are read from `~/.backprop/experiments.json`. This file is created after your first `backprop run`. If you've run experiments from a different machine or user, the file may be in a different location.

**GPU status shows "N/A"**
The GPU status bar relies on `backprop status`, which uses `nvidia-smi`. Ensure NVIDIA drivers are installed and `nvidia-smi` is on your PATH.
