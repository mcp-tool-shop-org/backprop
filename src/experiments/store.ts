import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface RunRecord {
  id: string;
  name?: string;
  scriptPath: string;
  status: 'running' | 'completed' | 'failed' | 'timeboxed' | 'stopped';
  lastCheckpoint?: string;
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
    } catch (e) {
      // Ignore if file doesn't exist or is invalid
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
    return run?.lastCheckpoint;
  }

  async listExperiments(): Promise<RunRecord[]> {
    return Array.from(this.db.values()).sort((a, b) => b.startTime - a.startTime);
  }

  private async persist() {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    const obj = Object.fromEntries(this.db);
    await fs.writeFile(this.dbPath, JSON.stringify(obj, null, 2), 'utf-8');
  }
}
