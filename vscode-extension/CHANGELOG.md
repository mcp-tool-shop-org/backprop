# Changelog

All notable changes to the Backprop VS Code extension will be documented in this file.

## [0.3.0] - 2026-02-23

### Added
- All 6 commands fully implemented: run, configure & run, resume, stop, show terminal, refresh
- Shell injection prevention via `safeQuote()` for all terminal commands
- GPU status bar now calls `nvidia-smi` directly (no CLI dependency) with 10-second refresh
- Cross-platform file watcher using `vscode.workspace.createFileSystemWatcher`
- Beefed-up README with logo, landing page link, and "How It Works" section
- Keyboard shortcuts: Run (`Ctrl+Alt+R`), Configure & Run (`Ctrl+Alt+Shift+R`), Stop (`Ctrl+Alt+S`)

### Fixed
- Extension was a 41-line stub with only 1 of 6 commands wired up — now fully implemented
- Proper `vscode.Disposable` implementation on `ExperimentTreeProvider` (no unsafe cast)

## [0.2.2] - 2026-02-23

### Added
- Keyboard shortcuts for the 3 most-used commands: Run (`Ctrl+Alt+R`), Configure & Run (`Ctrl+Alt+Shift+R`), Stop (`Ctrl+Alt+S`)
- Troubleshooting section in README

## [0.2.1] - 2025-12-22

### Added
- GPU VRAM + temperature status bar item (auto-refreshes every 30 seconds)
- Experiment tree view with expandable detail rows (ID, script, duration, loss, checkpoints)
- Run management: stop (SIGINT), resume, and show terminal from the tree view
- File watcher on `experiments.json` for automatic tree refresh

## [0.2.0] - 2025-12-15

### Added
- Concurrent training runs — each run launches in a dedicated terminal
- "Run with Backprop (Configure...)" with prompts for name, timeout, and framework
- Editor title bar play/gear buttons on Python files

## [0.1.0] - 2025-12-08

### Added
- Initial release
- Quick-run command for active Python files
- CLI installation check on activation
