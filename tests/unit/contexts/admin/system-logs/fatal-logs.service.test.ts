import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FatalLogsService } from "@/src/contexts/admin/system-logs/services/fatal-logs.service";

const line = (timestamp: string, role: string, message: string) =>
  JSON.stringify({
    timestamp,
    kind: "uncaughtException",
    role,
    error: { name: "Error", message },
  });

describe("FatalLogsService", () => {
  let dir: string;
  const previousDir = process.env.FATAL_LOG_DIR;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "fatal-logs-"));
    process.env.FATAL_LOG_DIR = dir;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    process.env.FATAL_LOG_DIR = previousDir;
  });

  it("returns an empty result when no log files exist", async () => {
    const result = await new FatalLogsService().findRecent("all", 50);

    expect(result).toEqual({ total: 0, skipped: 0, entries: [] });
  });

  it("merges api, worker and rotated files newest first", async () => {
    writeFileSync(
      path.join(dir, "fatal-api.log.1"),
      `${line("2026-11-01T00:00:00.000Z", "api", "old")}\n`,
    );
    writeFileSync(
      path.join(dir, "fatal-api.log"),
      `${line("2026-11-03T00:00:00.000Z", "api", "newest")}\n`,
    );
    writeFileSync(
      path.join(dir, "fatal-worker.log"),
      `${line("2026-11-02T00:00:00.000Z", "worker", "middle")}\n`,
    );

    const result = await new FatalLogsService().findRecent("all", 50);

    expect(result.total).toBe(3);
    expect(result.entries.map((e) => e.timestamp)).toEqual([
      "2026-11-03T00:00:00.000Z",
      "2026-11-02T00:00:00.000Z",
      "2026-11-01T00:00:00.000Z",
    ]);
  });

  it("filters by role, applies limit and skips malformed lines", async () => {
    writeFileSync(
      path.join(dir, "fatal-api.log"),
      [
        line("2026-11-01T00:00:00.000Z", "api", "a"),
        "{not json",
        line("2026-11-02T00:00:00.000Z", "api", "b"),
        "",
      ].join("\n"),
    );
    writeFileSync(
      path.join(dir, "fatal-worker.log"),
      `${line("2026-11-05T00:00:00.000Z", "worker", "w")}\n`,
    );

    const result = await new FatalLogsService().findRecent("api", 1);

    expect(result.total).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.timestamp).toBe("2026-11-02T00:00:00.000Z");
  });
});
