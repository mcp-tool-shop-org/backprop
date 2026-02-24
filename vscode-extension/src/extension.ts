import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXPERIMENTS_PATH = path.join(os.homedir(), '.backprop', 'experiments.json');

function isBackpropInstalled(): boolean {
  try {
    cp.execSync('backprop --version', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function ensureCli(): boolean {
  if (isBackpropInstalled()) { return true; }
  vscode.window.showErrorMessage(
    'Backprop CLI is not installed. Run: npm install -g @mcptoolshop/backprop'
  );
  return false;
}

function formatDuration(startMs: number, endMs?: number): string {
  const ms = (endMs || Date.now()) - startMs;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) { return `${sec}s`; }
  const min = Math.floor(sec / 60);
  if (min < 60) { return `${min}m ${sec % 60}s`; }
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

/** Escape a string for safe use inside double quotes in shell commands. */
function safeQuote(s: string): string {
  return '"' + s.replace(/["\\$`]/g, '\\$&') + '"';
}

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

interface ExperimentRecord {
  id: string;
  name?: string;
  scriptPath: string;
  status: string;
  startTime: number;
  endTime?: number;
  lastLoss?: number;
  lastStep?: number;
  checkpoints?: string[];
}

type TreeNode = ExperimentRecord | { kind: 'detail'; label: string; value: string };

function isDetail(node: TreeNode): node is { kind: 'detail'; label: string; value: string } {
  return 'kind' in node && (node as any).kind === 'detail';
}

// ---------------------------------------------------------------------------
// Run tracker — maps run IDs to their terminals
// ---------------------------------------------------------------------------

class RunTracker {
  private terminals = new Map<string, vscode.Terminal>();
  private counter = 0;

  launch(filePath: string, runName: string, extraArgs: string = ''): string {
    this.counter++;
    const fileName = path.basename(filePath, path.extname(filePath));
    const terminalName = `Backprop: ${fileName} #${this.counter}`;
    const terminal = vscode.window.createTerminal(terminalName);
    const runId = `vscode-${Date.now()}-${this.counter}`;

    terminal.show(true);
    terminal.sendText(
      `backprop run ${safeQuote(filePath)} --name ${safeQuote(runName)} --run-id ${safeQuote(runId)}${extraArgs ? ' ' + extraArgs : ''}`
    );

    this.terminals.set(runId, terminal);

    const disposable = vscode.window.onDidCloseTerminal(t => {
      if (t === terminal) {
        this.terminals.delete(runId);
        disposable.dispose();
      }
    });

    return runId;
  }

  resume(runId: string, extraArgs: string = ''): void {
    const terminalName = `Backprop: resume ${runId.slice(0, 12)}`;
    const terminal = vscode.window.createTerminal(terminalName);
    terminal.show(true);
    terminal.sendText(`backprop resume ${safeQuote(runId)}${extraArgs ? ' ' + extraArgs : ''}`);
    this.terminals.set(runId, terminal);
  }

  stop(runId: string): boolean {
    const terminal = this.terminals.get(runId);
    if (terminal) {
      terminal.sendText('\x03');
      return true;
    }
    return false;
  }

  getTerminal(runId: string): vscode.Terminal | undefined {
    return this.terminals.get(runId);
  }
}

// ---------------------------------------------------------------------------
// Experiment tree provider — expandable with detail rows
// ---------------------------------------------------------------------------

class ExperimentTreeProvider implements vscode.TreeDataProvider<TreeNode>, vscode.Disposable {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private watcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    this.startWatching();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  private startWatching(): void {
    const dir = path.dirname(EXPERIMENTS_PATH);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const pattern = new vscode.RelativePattern(vscode.Uri.file(dir), 'experiments.json');
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
      this.watcher.onDidChange(() => this.refresh());
      this.watcher.onDidCreate(() => this.refresh());
      this.watcher.onDidDelete(() => this.refresh());
    } catch {
      // Silently fail — user can always manual-refresh
    }
  }

  dispose(): void {
    this.watcher?.dispose();
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    if (isDetail(element)) {
      const item = new vscode.TreeItem(`${element.label}: ${element.value}`, vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon('symbol-field');
      return item;
    }

    const run = element;
    const label = run.name || run.id;
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
    item.description = run.status;
    item.tooltip = [
      `ID: ${run.id}`,
      `Script: ${run.scriptPath}`,
      `Status: ${run.status}`,
      `Started: ${new Date(run.startTime).toLocaleString()}`,
      run.endTime ? `Ended: ${new Date(run.endTime).toLocaleString()}` : null,
      run.lastLoss !== undefined ? `Loss: ${run.lastLoss.toFixed(4)}` : null,
      run.lastStep !== undefined ? `Step: ${run.lastStep}` : null,
    ].filter(Boolean).join('\n');

    item.contextValue = run.status === 'running' ? 'runningExperiment' : 'stoppedExperiment';

    switch (run.status) {
      case 'completed':
        item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
        break;
      case 'failed':
        item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
        break;
      case 'running':
        item.iconPath = new vscode.ThemeIcon('sync~spin');
        break;
      case 'timeboxed':
        item.iconPath = new vscode.ThemeIcon('watch', new vscode.ThemeColor('editorWarning.foreground'));
        break;
      default:
        item.iconPath = new vscode.ThemeIcon('circle-outline');
        break;
    }

    return item;
  }

  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      return this.loadExperiments();
    }

    if (!isDetail(element)) {
      const run = element;
      const details: TreeNode[] = [];
      details.push({ kind: 'detail', label: 'ID', value: run.id });
      details.push({ kind: 'detail', label: 'Script', value: run.scriptPath });
      details.push({ kind: 'detail', label: 'Duration', value: formatDuration(run.startTime, run.endTime) });
      if (run.lastStep !== undefined) {
        details.push({ kind: 'detail', label: 'Steps', value: String(run.lastStep) });
      }
      if (run.lastLoss !== undefined) {
        details.push({ kind: 'detail', label: 'Loss', value: run.lastLoss.toFixed(4) });
      }
      if (run.checkpoints && run.checkpoints.length > 0) {
        details.push({ kind: 'detail', label: 'Checkpoints', value: String(run.checkpoints.length) });
      }
      details.push({ kind: 'detail', label: 'Started', value: new Date(run.startTime).toLocaleString() });
      if (run.endTime) {
        details.push({ kind: 'detail', label: 'Ended', value: new Date(run.endTime).toLocaleString() });
      }
      return details;
    }

    return [];
  }

  getParent(): vscode.ProviderResult<TreeNode> {
    return undefined;
  }

  private loadExperiments(): ExperimentRecord[] {
    try {
      const data = fs.readFileSync(EXPERIMENTS_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      return (Object.values(parsed) as ExperimentRecord[])
        .sort((a, b) => b.startTime - a.startTime);
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// GPU status bar — polls nvidia-smi directly (no CLI dependency)
// ---------------------------------------------------------------------------

class GpuStatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'backprop.runWithOptions';
    this.item.show();
    this.update();
    this.timer = setInterval(() => this.update(), 10000);
  }

  private update(): void {
    cp.execFile('nvidia-smi', [
      '--query-gpu=memory.free,temperature.gpu',
      '--format=csv,noheader,nounits'
    ], { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        this.item.text = '$(chip) GPU: N/A';
        this.item.tooltip = 'Backprop: No NVIDIA GPU detected or nvidia-smi unavailable';
        return;
      }
      const parts = stdout.trim().split('\n')[0].split(',').map(s => s.trim());
      const freeMB = parseInt(parts[0], 10);
      const tempC = parseInt(parts[1], 10);
      if (isNaN(freeMB) || isNaN(tempC)) {
        this.item.text = '$(chip) GPU: N/A';
        this.item.tooltip = 'Backprop: Could not parse nvidia-smi output';
        return;
      }
      const freeGB = (freeMB / 1024).toFixed(1);
      this.item.text = `$(chip) ${freeGB}GB free | ${tempC}\u00B0C`;
      this.item.tooltip = `GPU VRAM: ${freeMB}MB free | Temp: ${tempC}\u00B0C\nClick to configure & run`;
    });
  }

  dispose(): void {
    if (this.timer) { clearInterval(this.timer); }
    this.item.dispose();
  }
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
  const tracker = new RunTracker();
  const treeProvider = new ExperimentTreeProvider();
  const statusBar = new GpuStatusBar();

  // CLI install check on activation
  if (!isBackpropInstalled()) {
    vscode.window.showWarningMessage(
      'Backprop CLI is not installed. Install it with: npm install -g @mcptoolshop/backprop',
      'Install Now'
    ).then(selection => {
      if (selection === 'Install Now') {
        const terminal = vscode.window.createTerminal('Backprop Install');
        terminal.show();
        terminal.sendText('npm install -g @mcptoolshop/backprop');
      }
    });
  }

  // --- Run (quick — no prompts) ----------------------------------------
  const runDisposable = vscode.commands.registerCommand('backprop.run', async (uri?: vscode.Uri) => {
    if (!ensureCli()) { return; }

    const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
    if (!targetUri || targetUri.scheme !== 'file') {
      vscode.window.showErrorMessage('Please open a Python file to run with Backprop.');
      return;
    }

    const filePath = targetUri.fsPath;
    const fileName = path.basename(filePath);
    tracker.launch(filePath, `VS Code: ${fileName}`);
  });

  // --- Run with options (prompts for name, timeout, framework) ----------
  const runWithOptionsDisposable = vscode.commands.registerCommand('backprop.runWithOptions', async (uri?: vscode.Uri) => {
    if (!ensureCli()) { return; }

    const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
    if (!targetUri || targetUri.scheme !== 'file') {
      vscode.window.showErrorMessage('Please open a Python file to run with Backprop.');
      return;
    }

    const filePath = targetUri.fsPath;
    const fileName = path.basename(filePath, path.extname(filePath));

    const name = await vscode.window.showInputBox({
      prompt: 'Experiment name',
      value: fileName,
      placeHolder: 'my-training-run'
    });
    if (name === undefined) { return; }

    const timeoutStr = await vscode.window.showInputBox({
      prompt: 'Max run time in minutes (leave empty for default 10)',
      placeHolder: '10',
      validateInput: (v) => {
        if (v === '') { return null; }
        const n = Number(v);
        return isNaN(n) || n <= 0 ? 'Enter a positive number' : null;
      }
    });
    if (timeoutStr === undefined) { return; }

    const framework = await vscode.window.showQuickPick(
      ['auto', 'pytorch', 'tensorflow'],
      { placeHolder: 'Select framework (default: auto)' }
    );
    if (framework === undefined) { return; }

    let extraArgs = '';
    if (timeoutStr) { extraArgs += ` -m ${timeoutStr}`; }
    if (framework !== 'auto') { extraArgs += ` -f ${framework}`; }

    tracker.launch(filePath, name || fileName, extraArgs);
  });

  // --- Resume experiment from tree view ---------------------------------
  const resumeDisposable = vscode.commands.registerCommand('backprop.resumeExperiment', async (node?: TreeNode) => {
    if (!ensureCli()) { return; }
    if (!node || isDetail(node)) { return; }

    const run = node;
    const timeoutStr = await vscode.window.showInputBox({
      prompt: `Resume "${run.name || run.id}" \u2014 max run time in minutes (leave empty for default)`,
      placeHolder: '10'
    });
    if (timeoutStr === undefined) { return; }

    const extraArgs = timeoutStr ? ` -m ${timeoutStr}` : '';
    tracker.resume(run.id, extraArgs);
    vscode.window.showInformationMessage(`Resuming run: ${run.name || run.id}`);
  });

  // --- Stop a running experiment ----------------------------------------
  const stopDisposable = vscode.commands.registerCommand('backprop.stopExperiment', async (node?: TreeNode) => {
    if (!node || isDetail(node)) { return; }

    const run = node;
    const stopped = tracker.stop(run.id);
    if (stopped) {
      vscode.window.showInformationMessage(`Sending stop signal to: ${run.name || run.id}`);
    } else {
      vscode.window.showWarningMessage(
        `Cannot find terminal for "${run.name || run.id}". It may have been started outside VS Code.`
      );
    }
  });

  // --- Show run in terminal (focus existing terminal) -------------------
  const showTerminalDisposable = vscode.commands.registerCommand('backprop.showTerminal', async (node?: TreeNode) => {
    if (!node || isDetail(node)) { return; }

    const terminal = tracker.getTerminal(node.id);
    if (terminal) {
      terminal.show();
    } else {
      vscode.window.showInformationMessage(`No active terminal for "${node.name || node.id}".`);
    }
  });

  // --- Refresh tree view ------------------------------------------------
  const refreshDisposable = vscode.commands.registerCommand('backprop.refreshExperiments', () => {
    treeProvider.refresh();
  });

  // Register tree
  const treeView = vscode.window.createTreeView('backpropExperiments', {
    treeDataProvider: treeProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(
    runDisposable,
    runWithOptionsDisposable,
    resumeDisposable,
    stopDisposable,
    showTerminalDisposable,
    refreshDisposable,
    treeView,
    treeProvider,
    statusBar
  );
}

export function deactivate() {}
