# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Response timeline:**
- Acknowledgment: within 48 hours
- Assessment: within 7 days
- Fix (if confirmed): within 30 days

## Scope

Backprop is a **CLI-first ML trainer** with intelligent resource governance.
- **Data accessed:** Reads training configuration files (`backprop.config.json`). Spawns Python training processes and monitors system resources (CPU, RAM, GPU via `nvidia-smi`). Writes experiment metadata and lockfiles to the project directory.
- **Data NOT accessed:** No network requests. No telemetry. No cloud services. No credential storage. Training data stays local — backprop orchestrates processes, it doesn't read training datasets.
- **Permissions required:** File system access for configuration, experiment logs, and lockfiles. Process spawning for Python training scripts. Optional: GPU monitoring via `nvidia-smi` on PATH.
