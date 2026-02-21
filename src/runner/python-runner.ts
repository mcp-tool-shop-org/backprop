import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import { Config } from '../config/schema.js';
import { Governor } from '../governor/policy.js';

export interface RunResult {
  success: boolean;
  exitCode: number | null;
  error?: string;
  durationMs: number;
}

export class PythonRunner {
  private process: ChildProcess | null = null;
  private startTime: number = 0;

  constructor(private config: Config, private governor: Governor) {}

  public async run(): Promise<RunResult> {
    const permission = await this.governor.canStartRun();
    if (!permission.allowed) {
      return {
        success: false,
        exitCode: null,
        error: `Governor rejected run: ${permission.reason}`,
        durationMs: 0
      };
    }

    this.startTime = Date.now();
    
    return new Promise((resolve) => {
      const args = [this.config.trainingScriptPath];
      
      if (this.config.framework !== 'auto') {
        args.push('--framework', this.config.framework);
      }
      
      if (this.config.checkpointEveryMinutes) {
        args.push('--checkpoint-interval', this.config.checkpointEveryMinutes.toString());
      }

      this.process = spawn('python', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let errorOutput = '';

      if (this.process.stdout) {
        const rl = createInterface({ input: this.process.stdout });
        rl.on('line', (line) => {
          try {
            const parsed = JSON.parse(line);
            this.handleProgress(parsed);
          } catch (e) {
            // Not JSONL, just log it
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

      // Timeout handling
      const timeoutMs = this.config.maxRunMinutes * 60 * 1000;
      const timeoutId = setTimeout(() => {
        if (this.process) {
          console.warn(`[Runner] Max run time of ${this.config.maxRunMinutes} minutes reached. Terminating.`);
          this.process.kill('SIGTERM');
        }
      }, timeoutMs);

      this.process.on('close', (code) => {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - this.startTime;
        
        resolve({
          success: code === 0,
          exitCode: code,
          error: code !== 0 ? errorOutput : undefined,
          durationMs
        });
      });
      
      this.process.on('error', (err) => {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - this.startTime;
        
        resolve({
          success: false,
          exitCode: null,
          error: err.message,
          durationMs
        });
      });
    });
  }

  private handleProgress(data: any) {
    // Handle JSONL progress updates from Python script
    if (data.step !== undefined && data.loss !== undefined) {
      console.log(`[Progress] Step: ${data.step}, Loss: ${data.loss}`);
    } else {
      console.log(`[Progress] ${JSON.stringify(data)}`);
    }
  }

  public stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
    }
  }
}
