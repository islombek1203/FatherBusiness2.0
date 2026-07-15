import type { NextRequest } from "next/server";
import { getTranslations, getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildExcelBuffer } from "@/lib/export/excel";
import { buildTablePdfBuffer } from "@/lib/export/pdf";
import { fileResponse, EXCEL_CONTENT_TYPE, PDF_CONTENT_TYPE } from "@/lib/export/response";
import type { ExportColumn } from "@/lib/export/types";

const EXPORT_LIMIT = 1000;

type Row = {
  date: string;
  product: string;
  type: string;
  quantityBefore: number;
  quantityAfter: number;
  user: string;
  note: string;
};

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const format = request.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const [t, tExport, locale] = await Promise.all([
    getTranslations("inventory"),
    getTranslations("export"),
    getLocale(),
  ]);

  const columns: ExportColumn<Row>[] = [
    { header: t("date"), accessor: (r) => r.date },
    { header: t("product"), accessor: (r) => r.product },
    { header: t("type"), accessor: (r) => r.type },
    { header: t("quantityBefore"), accessor: (r) => String(r.quantityBefore) },
    { header: t("quantityAfter"), accessor: (r) => String(r.quantityAfter) },
    { header: t("user"), accessor: (r) => r.user },
    { header: t("reason"), accessor: (r) => r.note },
  ];

  const entries = await prisma.inventoryHistory.findMany({
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const dateFormatter = new Intl.DateTimeFormat(user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const rows: Row[] = entries.map((entry) => ({
    date: dateFormatter.format(entry.createdAt),
    product: entry.product.name,
    type: t(`types.${entry.type}`),
    quantityBefore: entry.quantityBefore,
    quantityAfter: entry.quantityAfter,
    user: entry.user.name,
    note: entry.note ?? "",
  }));

  const dateLabel = tExport("generatedAt", {
    date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
  });

  if (format === "pdf") {
    const buffer = await buildTablePdfBuffer(t("title"), columns, rows, dateLabel);
    return fileResponse(buffer, "inventory-history.pdf", PDF_CONTENT_TYPE);
  }

  const buffer = await buildExcelBuffer(t("title"), columns, rows);
  return fileResponse(buffer, "inventory-history.xlsx", EXCEL_CONTENT_TYPE);
}
