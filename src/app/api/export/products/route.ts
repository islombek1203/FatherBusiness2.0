import type { NextRequest } from "next/server";
import { getTranslations, getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildExcelBuffer } from "@/lib/export/excel";
import { buildTablePdfBuffer } from "@/lib/export/pdf";
import { fileResponse, EXCEL_CONTENT_TYPE, PDF_CONTENT_TYPE } from "@/lib/export/response";
import type { ExportColumn } from "@/lib/export/types";
import { getTotalStock } from "@/lib/stock";

type Row = {
  sku: string;
  name: string;
  category: string;
  color: string;
  storeStock: number;
  homeStock: number;
  totalStock: number;
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
    { header: t("color"), accessor: (r) => r.color },
    { header: t("storeStock"), accessor: (r) => String(r.storeStock) },
    { header: t("homeStock"), accessor: (r) => String(r.homeStock) },
    { header: t("sellingPrice"), accessor: (r) => r.sellingPrice },
    { header: t("totalStock"), accessor: (r) => String(r.totalStock) },
  ];

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  const rows: Row[] = products.map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category.name,
    // Raw enum value (not the translated label) so a downstream edit +
    // re-import round-trips regardless of which locale exported the file —
    // the import parser matches PRODUCT_COLORS keys, not display text.
    color: p.color,
    storeStock: p.storeStock,
    homeStock: p.homeStock,
    totalStock: getTotalStock(p),
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
