<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <strong>Français</strong> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="./logo.png" alt="Backprop Logo" width="250" />
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

<a id="getting-started"></a>

## Commencer

<a id="1-install"></a>

### 1. Installation

```bash
npm install -g @mcptoolshop/backprop
```

<a id="2-run-a-training-script"></a>

### 2. Exécuter un script d'entraînement

```bash
backprop run train.py --name my-first-run
```

C'est tout. Backprop effectuera automatiquement :

1. Vérifier que votre système dispose de suffisamment de RAM et de mémoire GPU.
1. Lancer le script et suivre sa progression.
1. L'arrêter proprement après 10 minutes (configurable via `-m`).
1. Enregistrer les métadonnées et les points de contrôle de l'exécution dans `~/.backprop/experiments.json`.

<a id="how-it-works"></a>

## Comment ça fonctionne

<a id="the-governor"></a>

### Le Governor

Backprop inclut un intelligent Governor qui surveille les ressources de votre système avant et pendant une exécution. Il vérifie la charge du CPU, la RAM disponible et la mémoire/température GPU (via `nvidia-smi`). Si votre système est sous charge lourde ou surchauffe, le Governor empêchera l'exécution de commencer ou la mettra en pause jusqu'à ce que les ressources se libèrent.

<a id="short-runs-auto-resume"></a>

### Exécutions courtes + Reprise automatique

Au lieu d'exécuter un script pendant 48 heures d'affilée et de croiser les doigts pour qu'il ne plante pas, Backprop encourage les **exécutions limitées dans le temps**. Par défaut, les exécutions sont limitées à 10 minutes.

Si votre script génère des chemins de points de contrôle (par ex., `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop les mémorise. Vous pouvez facilement reprendre une exécution interrompue ou limitée dans le temps :

```bash
backprop resume <run-id>
```

<a id="resource-monitoring"></a>

### Surveillance des ressources

Backprop utilise `nvidia-smi` pour surveiller précisément les GPU NVIDIA. Il sélectionne automatiquement le GPU avec le plus de mémoire disponible et s'assure qu'il répond à vos exigences minimales avant de commencer une exécution.

Vous pouvez vérifier l'état actuel des ressources de votre système à tout moment :

```bash
backprop status
```

<a id="usage"></a>

## Utilisation

<a id="run-a-training-script"></a>

### Exécuter un script d'entraînement

```bash
backprop run train.py
```

Options :

- `-m, --max-run-minutes <minutes>` : Durée maximale d'exécution en minutes (par défaut : 10)
- `-f, --framework <type>` : Framework à utiliser (pytorch | tensorflow | auto) (par défaut : auto)
- `-c, --checkpoint-every-minutes <minutes>` : Intervalle de point de contrôle en minutes
- `-r, --resume-from <path>` : Chemin du point de contrôle à reprendre
- `--run-id <id>` : Identifiant unique pour cette exécution
- `-n, --name <name>` : Nom lisible pour cette expérience
- `-g, --gpu-memory-limit <limit>` : Limite de mémoire GPU (par ex., « 80% » ou « 8 » pour GB)
- `-p, --max-parallel <count>` : Nombre maximum d'exécutions parallèles
- `--min-free-ram <gb>` : RAM libre minimale en GB pour commencer l'exécution (par défaut : 4)
- `--gpu-probe <type>` : Type de sonde GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>` : VRAM libre minimale en MB pour commencer l'exécution (par défaut : 2500)
- `--gpu-max-temp <c>` : Température GPU maximale en Celsius (par défaut : 85)

<a id="configuration-file"></a>

### Fichier de configuration

Vous pouvez créer un `backprop.config.json` à la racine de votre projet :

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

### Lister les expériences

```bash
backprop list
```

<a id="development"></a>

## Développement

```bash
pnpm install
pnpm build
pnpm test
```
