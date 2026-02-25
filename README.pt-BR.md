<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <strong>Português</strong>
</p>

<p align="center">
  <img src="./logo.png" alt="Backprop Logo" width="250" />
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

<a id="getting-started"></a>

## Primeiros Passos

<a id="1-install"></a>

### 1. Instalar

```bash
npm install -g @mcptoolshop/backprop
```

<a id="2-run-a-training-script"></a>

### 2. Executar um Script de Treinamento

```bash
backprop run train.py --name my-first-run
```

É isso. Backprop irá automaticamente:

1. Verificar se seu sistema tem RAM e VRAM de GPU suficientes.
1. Iniciar o script e acompanhar seu progresso.
1. Desligá-lo graciosamente após 10 minutos (configurável via `-m`).
1. Salvar metadados da execução e checkpoints em `~/.backprop/experiments.json`.

<a id="how-it-works"></a>

## Como Funciona

<a id="the-governor"></a>

### O Governor

Backprop inclui um Governor inteligente que monitora os recursos do seu sistema antes e durante uma execução. Ele verifica carga de CPU, RAM disponível e VRAM/Temperatura de GPU (via `nvidia-smi`). Se seu sistema está sob carga pesada ou esfriando demais, o Governor impedirá que a execução comece ou pausará até que os recursos se liberem.

<a id="short-runs-auto-resume"></a>

### Execuções Curtas + Auto-Resume

Em vez de executar um script por 48 horas seguidas e rezar para que não quebre, Backprop incentiva **execuções com caixa de tempo**. Por padrão, execuções são limitadas a 10 minutos.

Se seu script produz caminhos de checkpoint (por exemplo, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop os lembra. Você pode facilmente retomar uma execução interrompida ou com caixa de tempo:

```bash
backprop resume <run-id>
```

<a id="resource-monitoring"></a>

### Monitoramento de Recursos

Backprop usa `nvidia-smi` para monitorar com precisão GPUs NVIDIA. Ele seleciona automaticamente a GPU com mais VRAM livre e garante que ela atenda aos seus requisitos mínimos antes de iniciar uma execução.

Você pode verificar o status atual de recursos do seu sistema a qualquer momento:

```bash
backprop status
```

<a id="usage"></a>

## Uso

<a id="run-a-training-script"></a>

### Executar um script de treinamento

```bash
backprop run train.py
```

Opções:

- `-m, --max-run-minutes <minutes>`: Tempo máximo de execução em minutos (padrão: 10)
- `-f, --framework <type>`: Framework a usar (pytorch | tensorflow | auto) (padrão: auto)
- `-c, --checkpoint-every-minutes <minutes>`: Intervalo de checkpoint em minutos
- `-r, --resume-from <path>`: Caminho do checkpoint para retomar a partir de
- `--run-id <id>`: Identificador único para esta execução
- `-n, --name <name>`: Nome legível para este experimento
- `-g, --gpu-memory-limit <limit>`: Limite de memória GPU (por exemplo, "80%" ou "8" para GB)
- `-p, --max-parallel <count>`: Execuções paralelas máximas
- `--min-free-ram <gb>`: RAM livre mínima em GB para iniciar execução (padrão: 4)
- `--gpu-probe <type>`: Tipo de sonda GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: VRAM livre mínima em MB para iniciar execução (padrão: 2500)
- `--gpu-max-temp <c>`: Temperatura máxima de GPU em Celsius (padrão: 85)

<a id="configuration-file"></a>

### Arquivo de Configuração

Você pode criar um `backprop.config.json` na raiz do seu projeto:

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

### Listar experimentos

```bash
backprop list
```

<a id="development"></a>

## Desenvolvimento

```bash
pnpm install
pnpm build
pnpm test
```
