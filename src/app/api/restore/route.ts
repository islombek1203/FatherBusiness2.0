import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { restoreDatabaseBackup } from "@/lib/restore";

const CONFIRMATION_PHRASE = "RESTORE";

export async function POST(request: NextRequest) {
  await requireRole(["ADMIN"]);

  const formData = await request.formData();
  const file = formData.get("file");
  const confirmation = formData.get("confirmation");

  if (confirmation !== CONFIRMATION_PHRASE) {
    return NextResponse.json({ ok: false, error: "confirmation" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "missingFile" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await restoreDatabaseBackup(buffer);
  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json({ ok: false, error: "restoreFailed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
