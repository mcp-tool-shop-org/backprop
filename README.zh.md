<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <strong>中文</strong> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="./logo.png" alt="Backprop Logo" width="250" />
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

<a id="getting-started"></a>

## 快速入门

<a id="1-install"></a>

### 1. 安装

```bash
npm install -g @mcptoolshop/backprop
```

<a id="2-run-a-training-script"></a>

### 2. 运行训练脚本

```bash
backprop run train.py --name my-first-run
```

就这样。Backprop 会自动：

1. 检查系统是否有足够的 RAM 和 GPU VRAM。
1. 启动脚本并跟踪其进度。
1. 在 10 分钟后优雅地关闭（可通过 `-m` 配置）。
1. 将运行元数据和检查点保存到 `~/.backprop/experiments.json`。

<a id="how-it-works"></a>

## 工作原理

<a id="the-governor"></a>

### Governor

Backprop 包含一个智能 Governor，可在运行前后和期间监控系统资源。它检查 CPU 负载、可用 RAM 和 GPU VRAM/温度（通过 `nvidia-smi`）。如果系统负载过重或温度过高，Governor 将阻止运行启动或暂停运行，直到资源释放。

<a id="short-runs-auto-resume"></a>

### 短运行 + 自动恢复

与其让脚本连续运行 48 小时并祈祷它不会崩溃，Backprop 提倡**时间盒式运行**。默认情况下，运行限制为 10 分钟。

如果脚本输出检查点路径（例如 `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`），Backprop 会记住它们。您可以轻松恢复中断或时间盒式运行：

```bash
backprop resume <run-id>
```

<a id="resource-monitoring"></a>

### 资源监控

Backprop 使用 `nvidia-smi` 精确监控 NVIDIA GPU。它会自动选择可用 VRAM 最多的 GPU，并在启动运行前确保其符合最低要求。

您可以随时检查系统的当前资源状态：

```bash
backprop status
```

<a id="usage"></a>

## 使用

<a id="run-a-training-script"></a>

### 运行训练脚本

```bash
backprop run train.py
```

选项：

- `-m, --max-run-minutes <minutes>`：最大运行时间（分钟）（默认：10）
- `-f, --framework <type>`：要使用的框架（pytorch | tensorflow | auto）（默认：auto）
- `-c, --checkpoint-every-minutes <minutes>`：检查点间隔（分钟）
- `-r, --resume-from <path>`：要恢复的检查点路径
- `--run-id <id>`：此运行的唯一标识符
- `-n, --name <name>`：此实验的人类可读名称
- `-g, --gpu-memory-limit <limit>`：GPU 内存限制（例如 "80%" 或 "8" 表示 GB）
- `-p, --max-parallel <count>`：最大并行运行数
- `--min-free-ram <gb>`：启动运行前最小可用 RAM（GB）（默认：4）
- `--gpu-probe <type>`：GPU 探针类型（auto | nvidia-smi | none）
- `--gpu-min-vram <mb>`：启动运行前最小可用 VRAM（MB）（默认：2500）
- `--gpu-max-temp <c>`：最大 GPU 温度（摄氏度）（默认：85）

<a id="configuration-file"></a>

### 配置文件

您可以在项目根目录中创建 `backprop.config.json`：

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

<a id="list-experiments"></a>

### 列出实验

```bash
backprop list
```

<a id="development"></a>

## 开发

```bash
pnpm install
pnpm build
pnpm test
```
