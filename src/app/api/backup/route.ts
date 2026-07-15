import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { createDatabaseBackup } from "@/lib/backup";
import { fileResponse } from "@/lib/export/response";
import { requireSameOrigin } from "@/lib/require-same-origin";

export async function GET(request: NextRequest) {
  await requireRole(["ADMIN"]);
  requireSameOrigin(request);

  try {
    const buffer = await createDatabaseBackup();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return fileResponse(buffer, `inventory-backup-${timestamp}.dump`, "application/octet-stream");
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ ok: false, error: "backupFailed" }, { status: 500 });
  }
}
