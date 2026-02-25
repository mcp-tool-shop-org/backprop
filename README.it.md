<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <strong>Italiano</strong> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="./logo.png" alt="Backprop Logo" width="250" />
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

<a id="getting-started"></a>

## Per Iniziare

<a id="1-install"></a>

### 1. Installazione

```bash
npm install -g @mcptoolshop/backprop
```

<a id="2-run-a-training-script"></a>

### 2. Eseguire uno Script di Addestramento

```bash
backprop run train.py --name my-first-run
```

Tutto qui. Backprop farà automaticamente:

1. Verificare se il sistema ha RAM e VRAM GPU sufficienti.
1. Avviare lo script e tracciare il suo progresso.
1. Arrestarlo correttamente dopo 10 minuti (configurabile tramite `-m`).
1. Salvare i metadati di esecuzione e i checkpoint in `~/.backprop/experiments.json`.

<a id="how-it-works"></a>

## Come Funziona

<a id="the-governor"></a>

### Il Governatore

Backprop include un intelligente Governatore che monitora le risorse di sistema prima e durante un'esecuzione. Verifica il carico della CPU, la RAM disponibile e la VRAM/Temperatura della GPU (tramite `nvidia-smi`). Se il sistema è sottoposto a carico pesante o si surriscalda, il Governatore impedirà l'avvio dell'esecuzione o la metterà in pausa fino a quando le risorse si libereranno.

<a id="short-runs-auto-resume"></a>

### Esecuzioni Brevi + Ripresa Automatica

Invece di eseguire uno script per 48 ore consecutive e sperare che non si blocchi, Backprop incoraggia **esecuzioni con scadenza temporale**. Per impostazione predefinita, le esecuzioni sono limitate a 10 minuti.

Se lo script genera percorsi di checkpoint (ad es. `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop li ricorda. È possibile riprendere facilmente un'esecuzione interrotta o con scadenza temporale:

```bash
backprop resume <run-id>
```

<a id="resource-monitoring"></a>

### Monitoraggio delle Risorse

Backprop utilizza `nvidia-smi` per monitorare accuratamente le GPU NVIDIA. Seleziona automaticamente la GPU con la maggior quantità di VRAM libera e assicura che soddisfi i requisiti minimi prima di avviare un'esecuzione.

È possibile verificare lo stato delle risorse attuali del sistema in qualsiasi momento:

```bash
backprop status
```

<a id="usage"></a>

## Utilizzo

<a id="run-a-training-script"></a>

### Eseguire uno script di addestramento

```bash
backprop run train.py
```

Opzioni:

- `-m, --max-run-minutes <minutes>`: Tempo massimo di esecuzione in minuti (predefinito: 10)
- `-f, --framework <type>`: Framework da utilizzare (pytorch | tensorflow | auto) (predefinito: auto)
- `-c, --checkpoint-every-minutes <minutes>`: Intervallo di checkpoint in minuti
- `-r, --resume-from <path>`: Percorso del checkpoint da cui riprendere
- `--run-id <id>`: Identificatore univoco per questa esecuzione
- `-n, --name <name>`: Nome leggibile per questo esperimento
- `-g, --gpu-memory-limit <limit>`: Limite di memoria GPU (ad es. "80%" o "8" per GB)
- `-p, --max-parallel <count>`: Numero massimo di esecuzioni parallele
- `--min-free-ram <gb>`: RAM libera minima in GB per avviare l'esecuzione (predefinito: 4)
- `--gpu-probe <type>`: Tipo di sonda GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: VRAM libera minima in MB per avviare l'esecuzione (predefinito: 2500)
- `--gpu-max-temp <c>`: Temperatura massima della GPU in Celsius (predefinito: 85)

<a id="configuration-file"></a>

### File di Configurazione

È possibile creare un `backprop.config.json` nella radice del progetto:

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

### Elencare gli esperimenti

```bash
backprop list
```

<a id="development"></a>

## Sviluppo

```bash
pnpm install
pnpm build
pnpm test
```
