<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Iniziare

### 1. Installazione

```bash
npm install -g @mcptoolshop/backprop
```

### 2. Esecuzione di uno script di training

```bash
backprop run train.py --name my-first-run
```

Ecco tutto. Backprop eseguirà automaticamente le seguenti operazioni:
1. Verificherà se il sistema dispone di RAM e VRAM della GPU sufficienti.
2. Avvierà lo script e ne seguirà l'avanzamento.
3. Lo interromperà in modo controllato dopo 10 minuti (configurabile tramite l'opzione `-m`).
4. Salverà i metadati dell'esecuzione e i checkpoint in `~/.backprop/experiments.json`.

## Come funziona

### Il Controller (Governor)
Backprop include un Controller intelligente che monitora le risorse del sistema prima e durante un'esecuzione. Controlla il carico della CPU, la RAM disponibile e la VRAM/temperatura della GPU (tramite `nvidia-smi`). Se il sistema è sotto carico elevato o funziona a temperature troppo alte, il Controller impedirà l'avvio dell'esecuzione o la interromperà fino a quando le risorse non saranno disponibili.

### Esecuzioni brevi + Ripresa automatica
Invece di eseguire uno script per 48 ore consecutive e sperare che non si blocchi, Backprop incoraggia le **esecuzioni a tempo determinato**. Per impostazione predefinita, le esecuzioni sono limitate a 10 minuti.

Se il tuo script genera percorsi di checkpoint (ad esempio, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop li memorizza. Puoi facilmente riprendere un'esecuzione interrotta o a tempo determinato:

```bash
backprop resume <run-id>
```

### Monitoraggio delle risorse
Backprop utilizza `nvidia-smi` per monitorare accuratamente le GPU NVIDIA. Seleziona automaticamente la GPU con la maggiore quantità di VRAM disponibile e verifica che soddisfi i requisiti minimi prima di avviare un'esecuzione.

Puoi controllare lo stato attuale delle risorse del tuo sistema in qualsiasi momento:

```bash
backprop status
```

## Utilizzo

### Esegui uno script di training

```bash
backprop run train.py
```

Opzioni:
- `-m, --max-run-minutes <minutes>`: Tempo massimo di esecuzione in minuti (predefinito: 10)
- `-f, --framework <type>`: Framework da utilizzare (pytorch | tensorflow | auto) (predefinito: auto)
- `-c, --checkpoint-every-minutes <minutes>`: Intervallo di salvataggio dei checkpoint in minuti
- `-r, --resume-from <path>`: Percorso del checkpoint da cui riprendere
- `--run-id <id>`: Identificatore univoco per questa esecuzione
- `-n, --name <name>`: Nome leggibile per questo esperimento
- `-g, --gpu-memory-limit <limit>`: Limite di memoria della GPU (ad esempio, "80%" o "8" per GB)
- `-p, --max-parallel <count>`: Numero massimo di esecuzioni parallele
- `--min-free-ram <gb>`: Quantità minima di RAM libera in GB per avviare l'esecuzione (predefinito: 4)
- `--gpu-probe <type>`: Tipo di controllo della GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: Quantità minima di VRAM libera in MB per avviare l'esecuzione (predefinito: 2500)
- `--gpu-max-temp <c>`: Temperatura massima della GPU in gradi Celsius (predefinito: 85)

### File di configurazione

Puoi creare un file `backprop.config.json` nella directory principale del tuo progetto:

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

### Elenco degli esperimenti

```bash
backprop list
```

## Sicurezza e ambito dei dati

Backprop opera **esclusivamente localmente**: non sono richieste connessioni di rete, non viene trasmessa alcuna telemetria e non vengono utilizzati servizi cloud.

- **Dati accessibili:** Legge i file di configurazione di training (`backprop.config.json`). Avvia i processi di training Python e monitora le risorse del sistema (CPU, RAM, GPU tramite `nvidia-smi`). Scrive i metadati dell'esperimento e i file di blocco nella directory del progetto.
- **Dati NON accessibili:** Nessuna richiesta di rete. Nessuna telemetria. Nessun archivio di credenziali. I dati di training rimangono locali: backprop orchestra i processi, ma non legge i dataset di training.
- **Autorizzazioni richieste:** Accesso al file system per la configurazione, i log degli esperimenti e i file di blocco. Avvio di processi per gli script di training Python.

Consulta il file [SECURITY.md](SECURITY.md) per segnalare eventuali vulnerabilità.

---

## Valutazione

| Categoria | Punteggio |
|----------|-------|
| Sicurezza | 10/10 |
| Gestione degli errori | 10/10 |
| Documentazione per gli operatori | 10/10 |
| Qualità del codice | 10/10 |
| Identità | 10/10 |
| **Overall** | **50/50** |

---

## Sviluppo

```bash
pnpm install
pnpm build
pnpm test
```

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
