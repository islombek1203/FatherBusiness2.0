import type { NextRequest } from "next/server";
import { getTranslations, getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildExcelBuffer } from "@/lib/export/excel";
import { buildTablePdfBuffer } from "@/lib/export/pdf";
import { fileResponse, EXCEL_CONTENT_TYPE, PDF_CONTENT_TYPE } from "@/lib/export/response";
import type { ExportColumn } from "@/lib/export/types";

type Row = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  sellingPrice: string;
  lastPurchasePrice: string;
};

export async function GET(request: NextRequest) {
  await requireUser();
  const format = request.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const [t, tExport, locale] = await Promise.all([
    getTranslations("products"),
    getTranslations("export"),
    getLocale(),
  ]);

  const columns: ExportColumn<Row>[] = [
    { header: t("sku"), accessor: (r) => r.sku },
    { header: t("name"), accessor: (r) => r.name },
    { header: t("category"), accessor: (r) => r.category },
    { header: t("unit"), accessor: (r) => r.unit },
    { header: t("stock"), accessor: (r) => String(r.stock) },
    { header: t("sellingPrice"), accessor: (r) => r.sellingPrice },
  ];

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  const rows: Row[] = products.map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category.name,
    unit: p.unit,
    stock: p.currentStock,
    sellingPrice: p.sellingPrice.toString(),
    lastPurchasePrice: p.lastPurchasePrice?.toString() ?? "",
  }));

  const dateLabel = tExport("generatedAt", {
    date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
  });

  if (format === "pdf") {
    const buffer = await buildTablePdfBuffer(t("title"), columns, rows, dateLabel);
    return fileResponse(buffer, "products.pdf", PDF_CONTENT_TYPE);
  }

  const buffer = await buildExcelBuffer(t("title"), columns, rows);
  return fileResponse(buffer, "products.xlsx", EXCEL_CONTENT_TYPE);
}
