import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import { Config } from '../config/schema.js';
import { Governor } from '../governor/policy.js';
import { ExperimentStore, RunRecord } from '../experiments/store.js';
import * as readline from 'readline';

export interface RunResult {
  success: boolean;
  exitCode: number | null;
  error?: string;
  durationMs: number;
  reason?: string;
}

export class PythonRunner {
  private process: ChildProcess | null = null;
  private startTime: number = 0;
  private abortController: AbortController;
  private runRecord!: RunRecord;

  constructor(
    private config: Config, 
    private governor: Governor,
    private store: ExperimentStore
  ) {
    this.abortController = new AbortController();
  }

  public async run(): Promise<RunResult> {
    const permission = await this.governor.canStartRun();
    if (!permission.allowed) {
      return {
        success: false,
        exitCode: null,
        error: `Governor rejected run: ${permission.reason}`,
        durationMs: 0,
        reason: 'governor_rejected'
      };
    }

    this.startTime = Date.now();
    
    // Initialize or fetch run record
    const existingRun = await this.store.getRun(this.config.runId);
    this.runRecord = existingRun || {
      id: this.config.runId,
      scriptPath: this.config.trainingScriptPath,
      status: 'running',
      startTime: this.startTime
    };
    this.runRecord.status = 'running';
    await this.store.saveRun(this.runRecord);

    // Auto-resume logic
    if (!this.config.resumeFrom) {
      const latestCheckpoint = await this.store.getLatestCheckpoint(this.config.runId);
      if (latestCheckpoint) {
        this.config.resumeFrom = latestCheckpoint;
        console.log(`[Runner] Auto-resuming from checkpoint: ${latestCheckpoint}`);
      }
    }
    
    return new Promise((resolve) => {
      const args = [this.config.trainingScriptPath];
      
      args.push('--run-id', this.config.runId);
      args.push('--max-minutes', this.config.maxRunMinutes.toString());
      
      if (this.config.framework !== 'auto') {
        args.push('--framework', this.config.framework);
      }
      
      if (this.config.checkpointEveryMinutes) {
        args.push('--checkpoint-every-seconds', (this.config.checkpointEveryMinutes * 60).toString());
      }

      if (this.config.resumeFrom) {
        args.push('--resume-from', this.config.resumeFrom);
      }

      this.process = spawn('python', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        signal: this.abortController.signal
      });

      let errorOutput = '';

      if (this.process.stdout) {
        const rl = createInterface({ input: this.process.stdout });
        rl.on('line', (line) => {
          try {
            const parsed = JSON.parse(line);
            this.handleProgress(parsed);
          } catch (e) {
            console.log(`[Python] ${line}`);
          }
        });
      }

      if (this.process.stderr) {
        this.process.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error(`[Python Error] ${data.toString().trim()}`);
        });
      }

      // Timeboxing & graceful stop
      const timeoutMs = this.config.maxRunMinutes * 60 * 1000;
      let forceKillTimeoutId: NodeJS.Timeout;
      
      const timeoutId = setTimeout(() => {
        if (this.process && this.process.exitCode === null) {
          console.warn(`[Runner] Max run time of ${this.config.maxRunMinutes} minutes reached. Sending SIGINT for graceful shutdown.`);
          this.process.kill('SIGINT');
          
          // Force kill after 30 seconds if it doesn't shut down gracefully
          forceKillTimeoutId = setTimeout(() => {
            if (this.process && this.process.exitCode === null) {
              console.warn(`[Runner] Process did not shut down gracefully. Sending SIGKILL.`);
              this.process.kill('SIGKILL');
            }
          }, 30000);
        }
      }, timeoutMs);

      this.process.on('close', async (code, signal) => {
        clearTimeout(timeoutId);
        if (forceKillTimeoutId) clearTimeout(forceKillTimeoutId);
        
        const durationMs = Date.now() - this.startTime;
        
        let reason = 'completed';
        if (signal === 'SIGINT' || signal === 'SIGKILL') {
          reason = 'timeboxed';
        } else if (code !== 0) {
          reason = 'error';
        }
        
        this.runRecord.status = reason === 'error' ? 'failed' : 'completed';
        this.runRecord.endTime = Date.now();
        await this.store.saveRun(this.runRecord);

        resolve({
          success: code === 0 || reason === 'timeboxed',
          exitCode: code,
          error: code !== 0 && reason !== 'timeboxed' ? errorOutput : undefined,
          durationMs,
          reason
        });
      });
      
      this.process.on('error', async (err) => {
        clearTimeout(timeoutId);
        if (forceKillTimeoutId) clearTimeout(forceKillTimeoutId);
        
        const durationMs = Date.now() - this.startTime;
        
        this.runRecord.status = 'failed';
        this.runRecord.endTime = Date.now();
        await this.store.saveRun(this.runRecord);

        resolve({
          success: false,
          exitCode: null,
          error: err.message,
          durationMs,
          reason: 'spawn_error'
        });
      });
    });
  }

  private async handleProgress(data: any) {
    if (data.step !== undefined && data.loss !== undefined) {
      console.log(`[Progress] Step: ${data.step}, Loss: ${data.loss}`);
    } else if (data.event === 'checkpoint_saved') {
      console.log(`[Checkpoint] Saved at ${data.path}`);
      if (!this.runRecord.checkpoints) {
        this.runRecord.checkpoints = [];
      }
      this.runRecord.checkpoints.push(data.path);
      await this.store.saveRun(this.runRecord);
    } else {
      console.log(`[Progress] ${JSON.stringify(data)}`);
    }
  }

  public stop() {
    if (this.process && this.process.exitCode === null) {
      this.process.kill('SIGINT');
      setTimeout(() => {
        if (this.process && this.process.exitCode === null) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    } else {
      this.abortController.abort();
    }
  }
}
