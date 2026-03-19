import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

export interface RunRecord {
  id: string;
  name?: string;
  scriptPath: string;
  status: 'running' | 'completed' | 'failed' | 'timeboxed' | 'stopped';
  lastCheckpoint?: string;
  checkpoints?: string[];
  lastStep?: number;
  lastLoss?: number;
  startTime: number;
  endTime?: number;
}

export class ExperimentStore {
  private dbPath: string;
  private db = new Map<string, RunRecord>();

  constructor(dbDir: string = path.join(os.homedir(), '.backprop')) {
    this.dbPath = path.join(dbDir, 'experiments.json');
  }

  async init() {
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const parsed = JSON.parse(data);
      for (const [k, v] of Object.entries(parsed)) {
        this.db.set(k, v as RunRecord);
      }
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        // First run — no file yet, this is normal
      } else {
        // Backup corrupted file before starting fresh
        try {
          const backupPath = this.dbPath + '.corrupt.' + Date.now();
          await fs.copyFile(this.dbPath, backupPath);
          console.warn(`Warning: Could not load experiments DB (${err.message}). Backed up to ${backupPath}. Starting fresh.`);
        } catch {
          console.warn(`Warning: Could not load experiments DB (${err.message}). Starting fresh.`);
        }
      }
    }
  }

  async saveRun(run: RunRecord) {
    this.db.set(run.id, run);
    await this.persist();
  }

  async getRun(runId: string): Promise<RunRecord | undefined> {
    return this.db.get(runId);
  }

  async getLatestCheckpoint(runId: string): Promise<string | undefined> {
    const run = this.db.get(runId);
    if (run?.checkpoints && run.checkpoints.length > 0) {
      return run.checkpoints[run.checkpoints.length - 1];
    }
    return run?.lastCheckpoint;
  }

  async listExperiments(): Promise<RunRecord[]> {
    return Array.from(this.db.values()).sort((a, b) => b.startTime - a.startTime);
  }

  private async persist() {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    const obj = Object.fromEntries(this.db);
    const json = JSON.stringify(obj, null, 2);

    // Atomic write: write to temp file then rename (rename is atomic on POSIX)
    const tmpPath = this.dbPath + '.' + randomUUID() + '.tmp';
    await fs.writeFile(tmpPath, json, 'utf-8');
    await fs.rename(tmpPath, this.dbPath);
  }
}
