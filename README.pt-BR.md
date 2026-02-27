<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

## Começar

### 1. Instalar

```bash
npm install -g @mcptoolshop/backprop
```

### 2. Executar um Script de Treinamento

```bash
backprop run train.py --name my-first-run
```

É só isso. O Backprop fará automaticamente:
1. Verificar se o seu sistema possui RAM e VRAM da GPU suficientes.
2. Iniciar o script e acompanhar seu progresso.
3. Encerrá-lo graciosamente após 10 minutos (configurável via `-m`).
4. Salvar os metadados da execução e os checkpoints em `~/.backprop/experiments.json`.

## Como Funciona

### O Controlador (Governor)
O Backprop inclui um Controlador inteligente que monitora os recursos do seu sistema antes e durante uma execução. Ele verifica a carga da CPU, a RAM disponível e a VRAM/temperatura da GPU (via `nvidia-smi`). Se o seu sistema estiver sob alta carga ou funcionando muito quente, o Controlador impedirá que a execução seja iniciada ou a pausará até que os recursos estejam disponíveis.

### Execuções Curtas + Retomada Automática
Em vez de executar um script por 48 horas seguidas e torcer para que ele não trave, o Backprop incentiva **execuções com tempo limitado**. Por padrão, as execuções são limitadas a 10 minutos.

Se o seu script emitir caminhos de checkpoint (por exemplo, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), o Backprop os memoriza. Você pode facilmente retomar uma execução interrompida ou com tempo limitado:

```bash
backprop resume <run-id>
```

### Monitoramento de Recursos
O Backprop usa `nvidia-smi` para monitorar com precisão as GPUs NVIDIA. Ele seleciona automaticamente a GPU com a maior quantidade de VRAM livre e garante que ela atenda aos seus requisitos mínimos antes de iniciar uma execução.

Você pode verificar o status atual dos recursos do seu sistema a qualquer momento:

```bash
backprop status
```

## Uso

### Executar um script de treinamento

```bash
backprop run train.py
```

Opções:
- `-m, --max-run-minutes <minutos>`: Tempo máximo de execução em minutos (padrão: 10)
- `-f, --framework <tipo>`: Framework a ser usado (pytorch | tensorflow | auto) (padrão: auto)
- `-c, --checkpoint-every-minutes <minutos>`: Intervalo de checkpoint em minutos
- `-r, --resume-from <caminho>`: Caminho do checkpoint para retomar
- `--run-id <id>`: Identificador único para esta execução
- `-n, --name <nome>`: Nome legível para esta experiência
- `-g, --gpu-memory-limit <limite>`: Limite de memória da GPU (por exemplo, "80%" ou "8" para GB)
- `-p, --max-parallel <contagem>`: Número máximo de execuções paralelas
- `--min-free-ram <gb>`: Quantidade mínima de RAM livre em GB para iniciar a execução (padrão: 4)
- `--gpu-probe <tipo>`: Tipo de sonda da GPU (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: Quantidade mínima de VRAM livre em MB para iniciar a execução (padrão: 2500)
- `--gpu-max-temp <c>`: Temperatura máxima da GPU em Celsius (padrão: 85)

### Arquivo de Configuração

Você pode criar um arquivo `backprop.config.json` na raiz do seu projeto:

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

## Segurança e Escopo de Dados

O Backprop opera **exclusivamente localmente** — sem requisições de rede, sem telemetria, sem serviços em nuvem.

- **Dados acessados:** Lê arquivos de configuração de treinamento (`backprop.config.json`). Inicia processos de treinamento em Python e monitora os recursos do sistema (CPU, RAM, GPU via `nvidia-smi`). Escreve metadados da experiência e arquivos de bloqueio no diretório do projeto.
- **Dados NÃO acessados:** Sem requisições de rede. Sem telemetria. Sem armazenamento de credenciais. Os dados de treinamento permanecem locais — o Backprop organiza os processos, ele não lê os conjuntos de dados de treinamento.
- **Permissões necessárias:** Acesso ao sistema de arquivos para configuração, logs de experimentos e arquivos de bloqueio. Criação de processos para scripts de treinamento em Python.

Consulte [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

---

## Avaliação

| Categoria | Pontuação |
|----------|-------|
| Segurança | 10/10 |
| Tratamento de Erros | 10/10 |
| Documentação do Operador | 10/10 |
| Higiene de Entrega | 10/10 |
| Identidade | 10/10 |
| **Overall** | **50/50** |

---

## Desenvolvimento

```bash
pnpm install
pnpm build
pnpm test
```

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
