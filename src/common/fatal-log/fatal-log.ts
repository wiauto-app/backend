import { appendFileSync, mkdirSync, renameSync, statSync } from "fs";
import path from "path";

/**
 * Registro de errores fatales (los que tumban el proceso) en un archivo JSONL.
 *
 * Lee `process.env` directamente y NO importa `envs`: si la validación Zod de
 * `envs.ts` falla al arrancar, también queremos dejar constancia en el archivo.
 *
 * Todo es síncrono a propósito: tras un `uncaughtException` el proceso termina
 * enseguida y una escritura asíncrona podría perderse.
 */

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type FatalKind =
  | "uncaughtException"
  | "unhandledRejection"
  | "bootstrapFailure";

interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: unknown;
  cause?: SerializedError;
}

function serializeError(error: unknown, depth = 0): SerializedError {
  if (error instanceof Error) {
    const serialized: SerializedError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    const { code } = error as { code?: unknown };
    if (code !== undefined) serialized.code = code;
    if (error.cause !== undefined && depth < 5) {
      serialized.cause = serializeError(error.cause, depth + 1);
    }
    return serialized;
  }

  let message: string;
  try {
    message = typeof error === "string" ? error : JSON.stringify(error);
  } catch {
    message = String(error);
  }
  return { name: "NonError", message };
}

/** Roles que escriben log fatal (uno por proceso: API y worker). */
export const FATAL_LOG_ROLES = ["api", "worker"] as const;
export type FatalLogRole = (typeof FATAL_LOG_ROLES)[number];

/** Ruta del archivo de un rol. El rotado vive en `${ruta}.1`. */
export function resolveFatalLogFile(role: string): string {
  const dir = path.resolve(process.env.FATAL_LOG_DIR ?? "logs");
  return path.join(dir, `fatal-${role}.log`);
}

const resolveLogFile = resolveFatalLogFile;

/** Rotación mínima: si supera el tamaño máximo, se mueve a `.1` (se pisa el anterior). */
function rotateIfNeeded(file: string): void {
  try {
    if (statSync(file).size >= MAX_FILE_BYTES) {
      renameSync(file, `${file}.1`);
    }
  } catch {
    // El archivo aún no existe
  }
}

export function writeFatalLog(
  kind: FatalKind,
  error: unknown,
  role = process.env.APP_ROLE ?? "api",
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    kind,
    role,
    pid: process.pid,
    node: process.version,
    environment: process.env.ENVIRONMENT,
    uptimeSeconds: Math.round(process.uptime()),
    memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    error: serializeError(error),
  };

  // stderr siempre: así también aparece en `docker logs`
  // eslint-disable-next-line no-console
  console.error(`[FATAL] ${kind}`, error);

  try {
    const file = resolveLogFile(role);
    mkdirSync(path.dirname(file), { recursive: true });
    rotateIfNeeded(file);
    appendFileSync(file, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (writeError) {
    // eslint-disable-next-line no-console
    console.error("[FATAL] No se pudo escribir el log de errores fatales", writeError);
  }
}

let installed = false;

/**
 * Registra los manejadores de proceso. Tras registrar el error el proceso sale
 * con código 1 para que Docker (`restart: unless-stopped`) lo reinicie: seguir
 * vivo tras un `uncaughtException` deja la app en estado indefinido.
 */
export function installFatalErrorHandlers(role?: string): void {
  if (installed) return;
  installed = true;

  process.on("uncaughtException", (error) => {
    writeFatalLog("uncaughtException", error, role);
    process.exit(1);
  });

  // Con un listener propio Node ya no tumba el proceso por defecto:
  // replicamos ese comportamiento tras dejar constancia.
  process.on("unhandledRejection", (reason) => {
    writeFatalLog("unhandledRejection", reason, role);
    process.exit(1);
  });
}
