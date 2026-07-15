import { spawn } from "node:child_process";
import { getPgToolsConnection } from "@/lib/db-url";

// Database-level backup (pg_dump custom format) rather than an in-app
// JSON export of every table: it's the only approach that reliably
// preserves referential integrity and doesn't drift from the schema as
// tables are added in later phases.
export async function createDatabaseBackup(): Promise<Buffer> {
  const { url, schema } = getPgToolsConnection();

  return new Promise((resolve, reject) => {
    const child = spawn("pg_dump", [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--schema",
      schema,
      "--dbname",
      url,
    ]);

    const chunks: Buffer[] = [];
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(stderr || `pg_dump exited with code ${code}`));
      }
    });
  });
}
