import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getPgToolsConnection } from "@/lib/db-url";

// Restores a pg_dump custom-format backup, replacing all current data
// (`--clean --if-exists`). This is the single most destructive action in
// the app — the caller (the /api/restore route) is responsible for
// requiring Admin role and explicit confirmation before invoking this.
export async function restoreDatabaseBackup(buffer: Buffer): Promise<void> {
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
}
