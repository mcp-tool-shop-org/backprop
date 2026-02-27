<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

### 1. インストール

```bash
npm install -g @mcptoolshop/backprop
```

### 2. トレーニングスクリプトの実行

```bash
backprop run train.py --name my-first-run
```

これで完了です。Backpropは自動的に以下の処理を行います。
1. システムが十分なRAMとGPU VRAMを持っているかを確認します。
2. スクリプトを開始し、その進行状況を追跡します。
3. 10分経過後（`-m`オプションで設定可能）に、安全に停止します。
4. 実行に関するメタデータとチェックポイントを`~/.backprop/experiments.json`に保存します。

## 仕組み

### Governor（制御機能）
Backpropには、実行前および実行中にシステムの資源を監視するインテリジェントなGovernorが組み込まれています。CPU負荷、利用可能なRAM、GPU VRAM/温度（`nvidia-smi`を使用）を確認します。システムに過剰な負荷がかかっていたり、温度が高すぎる場合は、Governorが実行を開始させないか、資源が解放されるまで一時停止させます。

### 短い実行時間 + 自動再開
48時間連続でスクリプトを実行し、クラッシュしないことを祈る代わりに、Backpropは**時間制限付きの実行**を推奨します。デフォルトでは、実行時間は10分に制限されています。

スクリプトがチェックポイントのパスを出力する場合（例：`{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`）、Backpropはそれらを記憶します。中断されたり、時間制限に達した実行を簡単に再開できます。

```bash
backprop resume <run-id>
```

### リソース監視
Backpropは、`nvidia-smi`を使用してNVIDIA GPUを正確に監視します。利用可能なVRAMが最も多いGPUを自動的に選択し、実行を開始する前に、必要な最小要件を満たしていることを確認します。

いつでもシステムの現在のリソース状況を確認できます。

```bash
backprop status
```

## 使い方

### トレーニングスクリプトの実行

```bash
backprop run train.py
```

オプション：
- `-m, --max-run-minutes <minutes>`: 最大実行時間（分）（デフォルト：10）
- `-f, --framework <type>`: 使用するフレームワーク（pytorch | tensorflow | auto）（デフォルト：auto）
- `-c, --checkpoint-every-minutes <minutes>`: チェックポイントの保存間隔（分）
- `-r, --resume-from <path>`: 再開するチェックポイントのパス
- `--run-id <id>`: この実行のユニークな識別子
- `-n, --name <name>`: この実験の人間が読める名前
- `-g, --gpu-memory-limit <limit>`: GPUメモリの制限（例： "80%" または "8"（GB））
- `-p, --max-parallel <count>`: 最大並列実行数
- `--min-free-ram <gb>`: 実行を開始するために必要な最小の空きRAM（GB）（デフォルト：4）
- `--gpu-probe <type>`: GPUのプロファイル方法（auto | nvidia-smi | none）
- `--gpu-min-vram <mb>`: 実行を開始するために必要な最小の空きVRAM（MB）（デフォルト：2500）
- `--gpu-max-temp <c>`: GPUの最大温度（摂氏）（デフォルト：85）

### 設定ファイル

プロジェクトのルートディレクトリに`backprop.config.json`を作成できます。

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

### 実験の一覧表示

```bash
backprop list
```

## セキュリティとデータ範囲

Backpropは**完全にローカル**で動作します。ネットワークリクエスト、テレメトリ、クラウドサービスは一切使用しません。

- **アクセスされるデータ:** トレーニング設定ファイル（`backprop.config.json`）を読み込みます。Pythonトレーニングプロセスを起動し、システムリソース（CPU、RAM、GPUを`nvidia-smi`経由で）を監視します。実験のメタデータとロックファイルをプロジェクトディレクトリに書き込みます。
- **アクセスされないデータ:** ネットワークリクエストは行いません。テレメトリも行いません。認証情報の保存もありません。トレーニングデータはローカルに保持されます。Backpropはプロセスをオーケストレーションしますが、トレーニングデータセットを読み込むことはありません。
- **必要な権限:** 設定ファイル、実験ログ、ロックファイルへのファイルシステムアクセス権。Pythonトレーニングスクリプトのプロセス起動権限。

脆弱性報告については、[SECURITY.md](SECURITY.md)を参照してください。

---

## 評価項目

| カテゴリ | 評価 |
|----------|-------|
| セキュリティ | 10/10 |
| エラー処理 | 10/10 |
| ドキュメント | 10/10 |
| 品質 | 10/10 |
| アイデンティティ | 10/10 |
| **Overall** | **50/50** |

---

## 開発

```bash
pnpm install
pnpm build
pnpm test
```

---

制作：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
