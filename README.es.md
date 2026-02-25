<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <strong>Español</strong> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="./logo.png" alt="Backprop Logo" width="250" />
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

<a id="getting-started"></a>

## Introducción

<a id="1-install"></a>

### 1. Instalar

```bash
npm install -g @mcptoolshop/backprop
```

<a id="2-run-a-training-script"></a>

### 2. Ejecutar un Script de Entrenamiento

```bash
backprop run train.py --name my-first-run
```

Eso es todo. Backprop automáticamente:

1. Verificará si tu sistema tiene suficiente RAM y VRAM en GPU.
1. Iniciará el script y rastreará su progreso.
1. Lo apagará elegantemente después de 10 minutos (configurable mediante `-m`).
1. Guardará los metadatos de ejecución y puntos de control en `~/.backprop/experiments.json`.

<a id="how-it-works"></a>

## Cómo Funciona

<a id="the-governor"></a>

### El Gobernador

Backprop incluye un Gobernador inteligente que monitorea los recursos de tu sistema antes y durante una ejecución. Verifica la carga de CPU, la RAM disponible y la VRAM/Temperatura de GPU (mediante `nvidia-smi`). Si tu sistema está bajo carga pesada o se está sobrecalentando, el Gobernador impedirá que la ejecución comience o la pausará hasta que se liberen recursos.

<a id="short-runs-auto-resume"></a>

### Ejecuciones Cortas + Reanudación Automática

En lugar de ejecutar un script durante 48 horas seguidas y rezar para que no falle, Backprop fomenta **ejecuciones con límite de tiempo**. Por defecto, las ejecuciones se limitan a 10 minutos.

Si tu script genera rutas de puntos de control (por ejemplo, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop las recuerda. Puedes reanimar fácilmente una ejecución interrumpida o con límite de tiempo:

```bash
backprop resume <run-id>
```

<a id="resource-monitoring"></a>

### Monitoreo de Recursos

Backprop utiliza `nvidia-smi` para monitorear con precisión las GPUs NVIDIA. Selecciona automáticamente la GPU con más VRAM libre y garantiza que cumpla con tus requisitos mínimos antes de iniciar una ejecución.

Puedes verificar el estado actual de los recursos de tu sistema en cualquier momento:

```bash
backprop status
```

<a id="usage"></a>

## Uso

<a id="run-a-training-script"></a>

### Ejecutar un script de entrenamiento

```bash
backprop run train.py
```

Opciones:

- `-m, --max-run-minutes <minutes>`: Tiempo máximo de ejecución en minutos (por defecto: 10)
- `-f, --framework <type>`: Framework a utilizar (pytorch | tensorflow | auto) (por defecto: auto)
- `-c, --checkpoint-every-minutes <minutes>`: Intervalo de punto de control en minutos
- `-r, --resume-from <path>`: Ruta del punto de control desde el que reanudar
- `--run-id <id>`: Identificador único para esta ejecución
- `-n, --name <name>`: Nombre legible por humanos para este experimento
- `-g, --gpu-memory-limit <limit>`: Límite de memoria de GPU (por ejemplo, "80%" o "8" para GB)
- `-p, --max-parallel <count>`: Número máximo de ejecuciones paralelas
- `--min-free-ram <gb>`: RAM libre mínima en GB para iniciar ejecución (por defecto: 4)
- `--gpu-probe <type>`: Tipo de sonda de GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: VRAM libre mínima en MB para iniciar ejecución (por defecto: 2500)
- `--gpu-max-temp <c>`: Temperatura máxima de GPU en Celsius (por defecto: 85)

<a id="configuration-file"></a>

### Archivo de Configuración

Puedes crear un `backprop.config.json` en la raíz de tu proyecto:

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

## Desarrollo

```bash
pnpm install
pnpm build
pnpm test
```
