import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: '@mcptoolshop/backprop',
  description: 'CLI-first ML trainer with intelligent resource governance — timeboxed runs, GPU monitoring, auto-resume from checkpoints',
  logoBadge: 'B',
  brandName: 'backprop',
  repoUrl: 'https://github.com/mcp-tool-shop-org/backprop',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/backprop',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'ML Trainer',
    headline: 'Train smarter.',
    headlineAccent: 'Not overnight.',
    description: 'CLI-first ML trainer with intelligent resource governance — timeboxed runs, GPU monitoring, and auto-resume from checkpoints.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: '#features', label: 'See features' },
    previews: [
      { label: 'Install', code: 'npm install -g @mcptoolshop/backprop' },
      { label: 'Run', code: 'backprop run train.py --name my-first-run' },
      { label: 'Resume', code: 'backprop resume <run-id>' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Resource governance for the real world.',
      features: [
        {
          title: 'Timeboxed Runs',
          desc: 'Default 10-minute timebox prevents runaway jobs and overnight surprises. Configure with -m for longer experiments.',
        },
        {
          title: 'Resource Governor',
          desc: 'Checks CPU load, RAM, GPU VRAM, and temperature before and during every run. Pauses automatically if your system overheats.',
        },
        {
          title: 'Auto-Resume',
          desc: 'Emits checkpoint paths via stdout JSON. Backprop remembers them — resume any interrupted or timeboxed run with a single command.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'Install',
          code: 'npm install -g @mcptoolshop/backprop',
        },
        {
          title: 'Start a run',
          code: 'backprop run train.py \\\n  --name my-experiment \\\n  -m 30 \\\n  --gpu-min-vram 4000',
        },
        {
          title: 'Resume a run',
          code: 'backprop resume <run-id>',
        },
        {
          title: 'Check system status',
          code: 'backprop status',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'cli-flags',
      title: 'CLI Flags',
      subtitle: 'All flags for backprop run.',
      columns: ['Flag', 'Default', 'Description'],
      rows: [
        ['-m, --max-run-minutes', '10', 'Maximum run time in minutes'],
        ['-f, --framework', 'auto', 'Framework: pytorch | tensorflow | auto'],
        ['-c, --checkpoint-every-minutes', '—', 'Checkpoint interval in minutes'],
        ['-r, --resume-from', '—', 'Path to checkpoint to resume from'],
        ['-n, --name', '—', 'Human-readable experiment name'],
        ['-g, --gpu-memory-limit', '—', 'GPU memory limit (e.g. "80%" or "8" for GB)'],
        ['--gpu-min-vram', '2500', 'Minimum free VRAM in MB to start run'],
        ['--gpu-max-temp', '85', 'Maximum GPU temperature in °C'],
        ['-p, --max-parallel', '1', 'Maximum number of parallel runs'],
      ],
    },
    {
      kind: 'api',
      id: 'config',
      title: 'Configuration File',
      subtitle: 'Create backprop.config.json in your project root to set defaults.',
      apis: [
        {
          signature: 'maxRunMinutes: number',
          description: 'Default maximum run time in minutes (default: 10).',
        },
        {
          signature: 'maxParallel: number',
          description: 'Maximum number of parallel runs allowed (default: 1).',
        },
        {
          signature: 'gpuMemoryLimit: string',
          description: 'GPU memory cap as a percentage ("80%") or absolute GB ("8").',
        },
        {
          signature: 'gpu.probe: "auto" | "nvidia-smi" | "none"',
          description: 'GPU detection method. Use "none" to disable GPU checks entirely.',
        },
        {
          signature: 'gpu.minFreeVramMB: number',
          description: 'Minimum free VRAM in MB required before starting a run (default: 2500).',
        },
        {
          signature: 'gpu.maxTempC: number',
          description: 'Maximum allowed GPU temperature in Celsius (default: 85).',
        },
      ],
    },
  ],
};
