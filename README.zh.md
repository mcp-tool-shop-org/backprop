<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/backprop/readme.png" alt="Backprop Logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/backprop/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/backprop/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/backprop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/backprop"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fbackprop" alt="npm version"></a>
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

## Getting Started

### 1. 安装

```bash
npm install -g @mcptoolshop/backprop
```

### 2. 运行训练脚本

```bash
backprop run train.py --name my-first-run
```

完成。Backprop 将自动执行以下操作：
1. 检查您的系统是否具有足够的 RAM 和 GPU VRAM。
2. 启动脚本并跟踪其进度。
3. 在 10 分钟后优雅地停止它（可通过 `-m` 参数进行配置）。
4. 将运行元数据和检查点保存到 `~/.backprop/experiments.json`。

## 工作原理

### 监控器 (Governor)
Backprop 包含一个智能监控器，它在运行之前和运行期间监控您的系统资源。它检查 CPU 负载、可用 RAM 以及 GPU VRAM/温度（通过 `nvidia-smi`）。如果您的系统负载过重或温度过高，监控器将阻止运行开始，或在资源释放后暂停运行。

### 短时间运行 + 自动恢复
与其让脚本连续运行 48 小时，并祈祷它不会崩溃，Backprop 鼓励**限制时间运行**。默认情况下，运行时间限制为 10 分钟。

如果您的脚本输出检查点路径（例如，`{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`），Backprop 会记住它们。您可以轻松恢复中断或时间限制的运行：

```bash
backprop resume <run-id>
```

### 资源监控
Backprop 使用 `nvidia-smi` 准确监控 NVIDIA GPU。它会自动选择具有最多可用 VRAM 的 GPU，并确保其满足您的最低要求，然后再开始运行。

您可以随时检查您系统的当前资源状态：

```bash
backprop status
```

## 用法

### 运行训练脚本

```bash
backprop run train.py
```

选项：
- `-m, --max-run-minutes <minutes>`: 最大运行时间（分钟）（默认：10）
- `-f, --framework <type>`: 使用的框架（pytorch | tensorflow | auto）（默认：auto）
- `-c, --checkpoint-every-minutes <minutes>`: 检查点间隔（分钟）
- `-r, --resume-from <path>`: 从哪个检查点恢复
- `--run-id <id>`: 此次运行的唯一标识符
- `-n, --name <name>`: 此次实验的人类可读名称
- `-g, --gpu-memory-limit <limit>`: GPU 内存限制（例如，"80%" 或 "8" 表示 GB）
- `-p, --max-parallel <count>`: 最大并行运行次数
- `--min-free-ram <gb>`: 启动运行所需的最小可用 RAM（GB）（默认：4）
- `--gpu-probe <type>`: GPU 探测类型（auto | nvidia-smi | none）
- `--gpu-min-vram <mb>`: 启动运行所需的最小可用 VRAM（MB）（默认：2500）
- `--gpu-max-temp <c>`: GPU 最大温度（摄氏度）（默认：85）

### 配置文件

您可以在项目的根目录下创建一个 `backprop.config.json` 文件：

```json
{
  "maxRunMinutes": 30,
  "maxParallel": 2,
  "gpuMemoryLimit": "80%",
  "gpu": {
    "probe": "auto",
    "minFreeVramMB": 2500,
    "maxTempC": 85
  }
}
```

### 列出实验

```bash
backprop list
```

## 安全与数据范围

Backprop **完全在本地运行**——没有网络请求、没有遥测数据，也没有云服务。

- **访问的数据：** 读取训练配置文件 (`backprop.config.json`)。 启动 Python 训练进程并监控系统资源（CPU、RAM、GPU 通过 `nvidia-smi`）。 将实验元数据和锁文件写入项目目录。
- **未访问的数据：** 没有网络请求。 没有遥测数据。 没有凭据存储。 训练数据保持在本地——Backprop 协调进程，它不读取训练数据集。
- **所需的权限：** 需要文件系统访问权限，用于配置、实验日志和锁文件。 需要进程创建权限，用于 Python 训练脚本。

请参阅 [SECURITY.md](SECURITY.md)，了解漏洞报告。

---

## 评分卡

| 类别 | 评分 |
|----------|-------|
| 安全性 | 10/10 |
| 错误处理 | 10/10 |
| 操作文档 | 10/10 |
| 软件质量 | 10/10 |
| 身份验证 | 10/10 |
| **Overall** | **50/50** |

---

## 开发

```bash
pnpm install
pnpm build
pnpm test
```

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
