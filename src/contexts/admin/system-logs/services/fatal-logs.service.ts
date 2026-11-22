import { Injectable } from "@nestjs/common";
import { open } from "fs/promises";

import {
  FATAL_LOG_ROLES,
  type FatalLogRole,
  resolveFatalLogFile,
} from "@/src/common/fatal-log/fatal-log";

/** Solo leemos la cola del archivo: suficiente para cientos de entradas. */
const TAIL_BYTES = 2 * 1024 * 1024;

export interface FatalLogEntry {
  timestamp: string;
  kind: string;
  role: string;
  [key: string]: unknown;
}

export interface FatalLogsResult {
  total: number;
  /** Líneas que no se pudieron parsear (p. ej. cortadas a mitad de escritura). */
  skipped: number;
  entries: FatalLogEntry[];
}

@Injectable()
export class FatalLogsService {
  /**
   * Últimos errores fatales, del más reciente al más antiguo. Incluye el
   * archivo rotado (`.1`) por si el actual se acaba de rotar.
   */
  async findRecent(
    role: FatalLogRole | "all",
    limit: number,
  ): Promise<FatalLogsResult> {
    const roles = role === "all" ? FATAL_LOG_ROLES : [role];

    const files = roles.flatMap((r) => {
      const file = resolveFatalLogFile(r);
      return [`${file}.1`, file];
    });

    const chunks = await Promise.all(files.map((file) => readTail(file)));

    let skipped = 0;
    const entries: FatalLogEntry[] = [];
    for (const line of chunks.flat()) {
      const entry = parseLine(line);
      if (entry) entries.push(entry);
      else skipped++;
    }

    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return {
      total: entries.length,
      skipped,
      entries: entries.slice(0, limit),
    };
  }
}

async function readTail(file: string): Promise<string[]> {
  let handle;
  try {
    handle = await open(file, "r");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  try {
    const { size } = await handle.stat();
    const start = Math.max(0, size - TAIL_BYTES);
    const buffer = Buffer.alloc(size - start);
    await handle.read(buffer, 0, buffer.length, start);

    const lines = buffer.toString("utf8").split("\n");
    // Si empezamos a mitad del archivo, la primera línea está incompleta
    if (start > 0) lines.shift();
    return lines.filter((line) => line.trim() !== "");
  } finally {
    await handle.close();
  }
}

function parseLine(line: string): FatalLogEntry | null {
  try {
    const parsed: unknown = JSON.parse(line);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as FatalLogEntry).timestamp === "string"
    ) {
      return parsed as FatalLogEntry;
    }
    return null;
  } catch {
    return null;
  }
}
