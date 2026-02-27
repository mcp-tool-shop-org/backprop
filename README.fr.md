<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

### 1. Installation

```bash
npm install -g @mcptoolshop/backprop
```

### 2. Exécution d'un script d'entraînement

```bash
backprop run train.py --name my-first-run
```

C'est tout. Backprop effectuera automatiquement les actions suivantes :
1. Vérifier si votre système dispose de suffisamment de RAM et de VRAM GPU.
2. Démarrer le script et suivre sa progression.
3. L'arrêter proprement après 10 minutes (configurable via l'option `-m`).
4. Enregistrer les métadonnées de l'exécution et les points de contrôle dans `~/.backprop/experiments.json`.

## Fonctionnement

### Le contrôleur (Governor)
Backprop inclut un contrôleur intelligent qui surveille les ressources de votre système avant et pendant une exécution. Il vérifie la charge du CPU, la RAM disponible et la VRAM/température du GPU (via `nvidia-smi`). Si votre système est fortement sollicité ou fonctionne à une température excessive, le contrôleur empêchera le démarrage de l'exécution ou la mettra en pause jusqu'à ce que les ressources soient libérées.

### Exécutions courtes + Reprise automatique
Au lieu d'exécuter un script pendant 48 heures sans interruption et d'espérer qu'il ne plante pas, Backprop encourage les **exécutions limitées dans le temps**. Par défaut, les exécutions sont limitées à 10 minutes.

Si votre script génère des chemins de points de contrôle (par exemple, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), Backprop les mémorise. Vous pouvez facilement reprendre une exécution interrompue ou limitée dans le temps :

```bash
backprop resume <run-id>
```

### Surveillance des ressources
Backprop utilise `nvidia-smi` pour surveiller avec précision les GPU NVIDIA. Il sélectionne automatiquement le GPU disposant de la plus grande quantité de VRAM libre et s'assure qu'il répond à vos exigences minimales avant de démarrer une exécution.

Vous pouvez vérifier l'état actuel des ressources de votre système à tout moment :

```bash
backprop status
```

## Utilisation

### Exécution d'un script d'entraînement

```bash
backprop run train.py
```

Options :
- `-m, --max-run-minutes <minutes>` : Durée maximale d'exécution en minutes (par défaut : 10)
- `-f, --framework <type>` : Framework à utiliser (pytorch | tensorflow | auto) (par défaut : auto)
- `-c, --checkpoint-every-minutes <minutes>` : Intervalle de sauvegarde des points de contrôle en minutes
- `-r, --resume-from <path>` : Chemin du point de contrôle à partir duquel reprendre
- `--run-id <id>` : Identifiant unique pour cette exécution
- `-n, --name <name>` : Nom lisible par l'utilisateur pour cette expérience
- `-g, --gpu-memory-limit <limit>` : Limite de mémoire GPU (par exemple, "80%" ou "8" pour Go)
- `-p, --max-parallel <count>` : Nombre maximal d'exécutions parallèles
- `--min-free-ram <gb>` : Quantité minimale de RAM libre en Go pour démarrer l'exécution (par défaut : 4)
- `--gpu-probe <type>` : Type de sonde GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>` : Quantité minimale de VRAM libre en Mo pour démarrer l'exécution (par défaut : 2500)
- `--gpu-max-temp <c>` : Température maximale du GPU en degrés Celsius (par défaut : 85)

### Fichier de configuration

Vous pouvez créer un fichier `backprop.config.json` à la racine de votre projet :

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

### Liste des expériences

```bash
backprop list
```

## Sécurité et portée des données

Backprop fonctionne **entièrement localement** — aucune requête réseau, aucune télémétrie, aucun service cloud.

- **Données accessibles :** Lecture des fichiers de configuration d'entraînement (`backprop.config.json`). Lancement des processus d'entraînement Python et surveillance des ressources système (CPU, RAM, GPU via `nvidia-smi`). Écriture des métadonnées des expériences et des fichiers de verrouillage dans le répertoire du projet.
- **Données NON accessibles :** Aucune requête réseau. Aucune télémétrie. Aucun stockage d'informations d'identification. Les données d'entraînement restent locales — backprop orchestre les processus, il ne lit pas les ensembles de données d'entraînement.
- **Autorisations requises :** Accès au système de fichiers pour la configuration, les journaux des expériences et les fichiers de verrouillage. Lancement de processus pour les scripts d'entraînement Python.

Consultez [SECURITY.md](SECURITY.md) pour signaler les vulnérabilités.

---

## Tableau de bord

| Catégorie | Score |
|----------|-------|
| Sécurité | 10/10 |
| Gestion des erreurs | 10/10 |
| Documentation pour les opérateurs | 10/10 |
| Hygiène de livraison | 10/10 |
| Identité | 10/10 |
| **Overall** | **50/50** |

---

## Développement

```bash
pnpm install
pnpm build
pnpm test
```

---

Développé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
