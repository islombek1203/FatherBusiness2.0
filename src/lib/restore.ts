import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getPgToolsConnection } from "@/lib/db-url";

export class RestoreInProgressError extends Error {
  constructor() {
    super("A restore is already in progress");
    this.name = "RestoreInProgressError";
  }
}

// pg_restore --clean is not safe to run concurrently against the same
// database — two overlapping runs race their DROP/CREATE statements and
// leave the schema half-restored (seen firsthand: parallel e2e runs hit
// "duplicate key" / "no unique constraint" errors this way). A single
// in-process lock is enough since restores are Admin-only, deliberate, rare
// actions — this only needs to prevent accidental double-submission, not
// coordinate across multiple server instances.
let restoreInProgress = false;

// Restores a pg_dump custom-format backup, replacing all current data
// (`--clean --if-exists`). This is the single most destructive action in
// the app — the caller (the /api/restore route) is responsible for
// requiring Admin role and explicit confirmation before invoking this.
export async function restoreDatabaseBackup(buffer: Buffer): Promise<void> {
  if (restoreInProgress) throw new RestoreInProgressError();
  restoreInProgress = true;

  try {
    const { url } = getPgToolsConnection();

    const dir = await mkdtemp(path.join(tmpdir(), "inventory-restore-"));
    const filePath = path.join(dir, "backup.dump");

    try {
      await writeFile(filePath, buffer);

      await new Promise<void>((resolve, reject) => {
        const child = spawn("pg_restore", [
          "--clean",
          "--if-exists",
          "--no-owner",
          "--no-privileges",
          "--dbname",
          url,
          filePath,
        ]);

        let stderr = "";
        child.stderr.on("data", (chunk: Buffer) => {
          stderr += chunk.toString();
        });
        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(stderr || `pg_restore exited with code ${code}`));
          }
        });
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  } finally {
    restoreInProgress = false;
  }
}
