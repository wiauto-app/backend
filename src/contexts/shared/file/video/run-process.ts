import { spawn } from "node:child_process";

export interface RunProcessResult {
  stdout: string;
  stderr: string;
}

const MAX_CAPTURED_OUTPUT = 64 * 1024;

/**
 * Ejecuta un binario sin shell (los argumentos nunca se interpretan) con timeout.
 * Rechaza si el código de salida no es 0, incluyendo el final de stderr.
 */
export const runProcess = (
  command: string,
  args: string[],
  timeout_ms: number,
): Promise<RunProcessResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timed_out = false;

    const timer = setTimeout(() => {
      timed_out = true;
      child.kill("SIGKILL");
    }, timeout_ms);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > MAX_CAPTURED_OUTPUT) {
        stderr = stderr.slice(-MAX_CAPTURED_OUTPUT);
      }
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timed_out) {
        reject(new Error(`${command} superó ${timeout_ms}ms`));
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `${command} terminó con código ${code}: ${stderr.trim().slice(-500)}`,
          ),
        );
        return;
      }
      resolve({ stdout, stderr });
    });
  });
