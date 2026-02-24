<p align="center">
  <img src="logo.png" alt="Backprop" width="280" />
</p>

<p align="center">
  <strong>Run, monitor, and manage ML training runs directly from VS Code.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/backprop">npm</a> &middot;
  <a href="https://github.com/mcp-tool-shop-org/backprop">GitHub</a> &middot;
  <a href="https://mcp-tool-shop-org.github.io/backprop/">Landing Page</a>
</p>

---

Backprop is a CLI-first ML trainer with intelligent resource governance — timeboxed runs, GPU monitoring, and auto-resume from checkpoints. This extension brings the full workflow into your editor.

## Features

### Run Training Scripts

Launch any Python training script directly from the editor. Each run gets its own dedicated terminal — run multiple experiments in parallel while the Governor keeps your machine healthy.

- **Quick run** (`Ctrl+Alt+R`): One-click launch from any Python file
- **Configured run** (`Ctrl+Alt+Shift+R`): Set experiment name, timeout, and framework before launching
- Play and gear buttons appear in the editor title bar for Python files

### Experiment Sidebar

Browse all your training experiments in the Backprop activity bar. Each run is expandable to show full details:

- **Status icons** — spinning sync (running), green check (completed), red error (failed), clock (timeboxed)
- **Expand any run** to see: ID, script path, duration, steps completed, current loss, checkpoint count, start/end timestamps
- **Auto-refreshes** when `experiments.json` changes on disk — no manual refresh needed
- **Context menus** with actions based on run status (stop, resume, show terminal)

### Run Management

- **Stop** (`Ctrl+Alt+S`): Send SIGINT for graceful shutdown — the script can save a final checkpoint before exiting
- **Resume**: Pick up any completed, failed, or timeboxed experiment from its last checkpoint
- **Show Terminal**: Jump to a running experiment's live output

Inline action buttons appear directly on tree items — stop/terminal for running experiments, resume for stopped ones.

### GPU Status Bar

A persistent status bar item shows real-time GPU VRAM and temperature, refreshing every 10 seconds. Reads `nvidia-smi` directly — no CLI dependency required. Click it to launch a configured run.

## Keyboard Shortcuts

| Shortcut | Command | When |
|----------|---------|------|
| `Ctrl+Alt+R` (`Cmd+Alt+R` on Mac) | Run with Backprop | Python file is active |
| `Ctrl+Alt+Shift+R` (`Cmd+Alt+Shift+R` on Mac) | Run with Backprop (Configure...) | Python file is active |
| `Ctrl+Alt+S` (`Cmd+Alt+S` on Mac) | Stop Run | Always |

All keybindings can be customized in VS Code's Keyboard Shortcuts editor (`Ctrl+K Ctrl+S`).

## Requirements

- **Backprop CLI** installed globally:
  ```
  npm install -g @mcptoolshop/backprop
  ```
- Python 3.x for training scripts
- NVIDIA GPU + drivers for GPU monitoring (optional — extension works without it)

The extension checks for the CLI on activation and offers a one-click install if missing.

## Commands

| Command | Description | Where |
|---------|-------------|-------|
| `Run with Backprop` | Quick-launch the active Python file | Editor title bar, Command Palette |
| `Run with Backprop (Configure...)` | Launch with name/timeout/framework prompts | Editor title bar, Command Palette, Status bar click |
| `Resume Run` | Resume a stopped experiment | Tree view context menu |
| `Stop Run` | Send SIGINT to a running experiment | Tree view context menu + inline |
| `Show Terminal` | Focus a running experiment's terminal | Tree view context menu + inline |
| `Refresh Experiments` | Manually reload the experiment list | Tree view title bar |

## How It Works

The extension is a thin UI layer over the [Backprop CLI](https://www.npmjs.com/package/@mcptoolshop/backprop). It reads experiment data from `~/.backprop/experiments.json` (the same file the CLI writes to), launches CLI commands in VS Code terminals, and watches the file for changes. No background processes, no network calls — just file reads and terminal commands.

## Troubleshooting

**"Backprop CLI is not installed"**
Run `npm install -g @mcptoolshop/backprop` and reload the window, or click "Install Now" when prompted.

**No experiments in the sidebar**
Experiments appear after your first `backprop run`. The data lives in `~/.backprop/experiments.json`.

**GPU status shows "N/A"**
The GPU status bar calls `nvidia-smi` directly. Ensure NVIDIA drivers are installed and `nvidia-smi` is on your PATH.

---

<p align="center">
  MIT License &middot; <a href="https://github.com/mcp-tool-shop-org">MCP Tool Shop</a>
</p>
