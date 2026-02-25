<p align="center">
  <a href="README.md">English</a> | <strong>日本語</strong> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="./logo.png" alt="Backprop Logo" width="250" />
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

<a id="getting-started"></a>

## はじめに

<a id="1-install"></a>

### 1. インストール

```bash
npm install -g @mcptoolshop/backprop
```

<a id="2-run-a-training-script"></a>

### 2. トレーニングスクリプトを実行

```bash
backprop run train.py --name my-first-run
```

以上です。Backprop は自動的に以下を実行します：

1. システムに十分な RAM と GPU VRAM があるかを確認します。
1. スクリプトを開始し、その進行状況を追跡します。
1. 10 分後に適切にシャットダウンします（`-m` で設定可能）。
1. 実行メタデータとチェックポイントを `~/.backprop/experiments.json` に保存します。

<a id="how-it-works"></a>

## 仕組み

<a id="the-governor"></a>

### Governor

Backprop には、実行の前中にシステムリソースを監視するインテリジェント Governor が含まれています。CPU 負荷、利用可能な RAM、GPU VRAM/温度を確認します（`nvidia-smi` 経由）。システムが高負荷状態にあるか、過熱している場合、Governor は実行の開始を防止するか、リソースが解放されるまで一時停止します。

<a id="short-runs-auto-resume"></a>

### 短い実行 + 自動再開

スクリプトを 48 時間連続で実行してクラッシュしないことを祈る代わりに、Backprop は **時間制限付き実行** を推奨します。デフォルトでは、実行は 10 分に制限されています。

スクリプトがチェックポイントパスを出力する場合（例：`{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`）、Backprop はそれを記憶します。中断またはタイムボックス化された実行を簡単に再開できます：

```bash
backprop resume <run-id>
```

<a id="resource-monitoring"></a>

### リソース監視

Backprop は `nvidia-smi` を使用して NVIDIA GPU を正確に監視します。最も空き VRAM がある GPU を自動的に選択し、実行を開始する前に最小要件を満たしていることを確認します。

いつでもシステムの現在のリソース状態を確認できます：

```bash
backprop status
```

<a id="usage"></a>

## 使い方

<a id="run-a-training-script"></a>

### トレーニングスクリプトを実行

```bash
backprop run train.py
```

オプション：

- `-m, --max-run-minutes <minutes>`: 最大実行時間（分単位）（デフォルト: 10）
- `-f, --framework <type>`: 使用するフレームワーク（pytorch | tensorflow | auto）（デフォルト: auto）
- `-c, --checkpoint-every-minutes <minutes>`: チェックポイント間隔（分単位）
- `-r, --resume-from <path>`: 再開するチェックポイントへのパス
- `--run-id <id>`: この実行の一意の識別子
- `-n, --name <name>`: この実験の人間が読める名前
- `-g, --gpu-memory-limit <limit>`: GPU メモリ上限（例："80%" または "8" GB 単位）
- `-p, --max-parallel <count>`: 最大並列実行数
- `--min-free-ram <gb>`: 実行開始時に必要な最小空き RAM（GB 単位）（デフォルト: 4）
- `--gpu-probe <type>`: GPU プローブタイプ（auto | nvidia-smi | none）
- `--gpu-min-vram <mb>`: 実行開始時に必要な最小空き VRAM（MB 単位）（デフォルト: 2500）
- `--gpu-max-temp <c>`: 最大 GPU 温度（℃ 単位）（デフォルト: 85）

<a id="configuration-file"></a>

### 設定ファイル

プロジェクトルートに `backprop.config.json` を作成できます：

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

### 実験を一覧表示

```bash
backprop list
```

<a id="development"></a>

## 開発

```bash
pnpm install
pnpm build
pnpm test
```
