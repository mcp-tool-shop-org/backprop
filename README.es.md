<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Comenzando

### 1. Instalación

```bash
npm install -g @mcptoolshop/backprop
```

### 2. Ejecutar un script de entrenamiento

```bash
backprop run train.py --name my-first-run
```

Eso es todo. Backprop hará automáticamente:
1. Verificar si su sistema tiene suficiente RAM y VRAM de la GPU.
2. Iniciar el script y rastrear su progreso.
3. Detenerlo de forma segura después de 10 minutos (configurable mediante `-m`).
4. Guardar los metadatos de la ejecución y los puntos de control en `~/.backprop/experiments.json`.

## Cómo funciona

### El Controlador (Governor)
Backprop incluye un Controlador inteligente que supervisa los recursos de su sistema antes y durante una ejecución. Verifica la carga de la CPU, la RAM disponible y la VRAM/temperatura de la GPU (a través de `nvidia-smi`). Si su sistema está bajo una carga pesada o funcionando demasiado caliente, el Controlador evitará que la ejecución se inicie o la pausará hasta que los recursos estén disponibles.

### Ejecuciones cortas + Reanudación automática
En lugar de ejecutar un script durante 48 horas seguidas y esperar que no se bloquee, Backprop fomenta las **ejecuciones con límites de tiempo**. Por defecto, las ejecuciones están limitadas a 10 minutos.

Si su script genera rutas de puntos de control (por ejemplo, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop las recuerda. Puede reanudar fácilmente una ejecución interrumpida o con límite de tiempo:

```bash
backprop resume <run-id>
```

### Monitoreo de recursos
Backprop utiliza `nvidia-smi` para monitorear con precisión las GPU de NVIDIA. Selecciona automáticamente la GPU con la mayor cantidad de VRAM disponible y se asegura de que cumpla con sus requisitos mínimos antes de iniciar una ejecución.

Puede verificar el estado actual de los recursos de su sistema en cualquier momento:

```bash
backprop status
```

## Uso

### Ejecutar un script de entrenamiento

```bash
backprop run train.py
```

Opciones:
- `-m, --max-run-minutes <minutos>`: Tiempo máximo de ejecución en minutos (por defecto: 10)
- `-f, --framework <tipo>`: Framework a utilizar (pytorch | tensorflow | auto) (por defecto: auto)
- `-c, --checkpoint-every-minutes <minutos>`: Intervalo de puntos de control en minutos
- `-r, --resume-from <ruta>`: Ruta al punto de control para reanudar
- `--run-id <id>`: Identificador único para esta ejecución
- `-n, --name <nombre>`: Nombre legible para este experimento
- `-g, --gpu-memory-limit <límite>`: Límite de memoria de la GPU (por ejemplo, "80%" o "8" para GB)
- `-p, --max-parallel <cantidad>`: Número máximo de ejecuciones paralelas
- `--min-free-ram <gb>`: Cantidad mínima de RAM libre en GB para iniciar la ejecución (por defecto: 4)
- `--gpu-probe <tipo>`: Tipo de sonda de la GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: Cantidad mínima de VRAM libre en MB para iniciar la ejecución (por defecto: 2500)
- `--gpu-max-temp <c>`: Temperatura máxima de la GPU en grados Celsius (por defecto: 85)

### Archivo de configuración

Puede crear un archivo `backprop.config.json` en la raíz de su proyecto:

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

### Listar experimentos

```bash
backprop list
```

## Seguridad y alcance de los datos

Backprop opera **completamente localmente**: no hay solicitudes de red, ni telemetría, ni servicios en la nube.

- **Datos accedidos:** Lee archivos de configuración de entrenamiento (`backprop.config.json`). Inicia procesos de entrenamiento de Python y supervisa los recursos del sistema (CPU, RAM, GPU a través de `nvidia-smi`). Escribe metadatos de experimentos y archivos de bloqueo en el directorio del proyecto.
- **Datos NO accedidos:** No hay solicitudes de red. No hay telemetría. No hay almacenamiento de credenciales. Los datos de entrenamiento permanecen locales: backprop orquesta los procesos, no lee los conjuntos de datos de entrenamiento.
- **Permisos requeridos:** Acceso al sistema de archivos para la configuración, los registros de experimentos y los archivos de bloqueo. Inicio de procesos para los scripts de entrenamiento de Python.

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

---

## Informe de rendimiento

| Categoría | Puntuación |
|----------|-------|
| Seguridad | 10/10 |
| Manejo de errores | 10/10 |
| Documentación para operadores | 10/10 |
| Higiene de envío | 10/10 |
| Identidad | 10/10 |
| **Overall** | **50/50** |

---

## Desarrollo

```bash
pnpm install
pnpm build
pnpm test
```

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
