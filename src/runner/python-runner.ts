import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import { Config } from '../config/schema.js';
import { Governor } from '../governor/policy.js';

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

  constructor(private config: Config, private governor: Governor) {
    this.abortController = new AbortController();
  }

  public async run(): Promise<RunResult> {
    const permission = await this.governor.canStartRun();
    if (!permission.allowed) {
      return {
        success: false,
        exitCode: null,
        error: \Governor rejected run: \\,
        durationMs: 0,
        reason: 'governor_rejected'
      };
    }

    this.startTime = Date.now();
    
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
            console.log(\[Python] \\);
          }
        });
      }

      if (this.process.stderr) {
        this.process.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error(\[Python Error] \\);
        });
      }

      // Timeboxing & graceful stop
      const timeoutMs = this.config.maxRunMinutes * 60 * 1000;
      let forceKillTimeoutId: NodeJS.Timeout;
      
      const timeoutId = setTimeout(() => {
        if (this.process && this.process.exitCode === null) {
          console.warn(\[Runner] Max run time of \ minutes reached. Sending SIGINT for graceful shutdown.\);
          this.process.kill('SIGINT');
          
          // Force kill after 30 seconds if it doesn't shut down gracefully
          forceKillTimeoutId = setTimeout(() => {
            if (this.process && this.process.exitCode === null) {
              console.warn(\[Runner] Process did not shut down gracefully. Sending SIGKILL.\);
              this.process.kill('SIGKILL');
            }
          }, 30000);
        }
      }, timeoutMs);

      this.process.on('close', (code, signal) => {
        clearTimeout(timeoutId);
        if (forceKillTimeoutId) clearTimeout(forceKillTimeoutId);
        
        const durationMs = Date.now() - this.startTime;
        
        let reason = 'completed';
        if (signal === 'SIGINT' || signal === 'SIGKILL') {
          reason = 'timeboxed';
        } else if (code !== 0) {
          reason = 'error';
        }
        
        resolve({
          success: code === 0 || reason === 'timeboxed',
          exitCode: code,
          error: code !== 0 && reason !== 'timeboxed' ? errorOutput : undefined,
          durationMs,
          reason
        });
      });
      
      this.process.on('error', (err) => {
        clearTimeout(timeoutId);
        if (forceKillTimeoutId) clearTimeout(forceKillTimeoutId);
        
        const durationMs = Date.now() - this.startTime;
        
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

  private handleProgress(data: any) {
    if (data.step !== undefined && data.loss !== undefined) {
      console.log(\[Progress] Step: \, Loss: \\);
    } else if (data.event === 'checkpoint_saved') {
      console.log(\[Checkpoint] Saved at \\);
    } else {
      console.log(\[Progress] \\);
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
