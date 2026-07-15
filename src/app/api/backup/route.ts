import { requireRole } from "@/lib/auth-helpers";
import { createDatabaseBackup } from "@/lib/backup";
import { fileResponse } from "@/lib/export/response";

export async function GET() {
  await requireRole(["ADMIN"]);

  const buffer = await createDatabaseBackup();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return fileResponse(buffer, `inventory-backup-${timestamp}.dump`, "application/octet-stream");
}
