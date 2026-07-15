import type { NextRequest } from "next/server";
import { getTranslations, getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildExcelBuffer } from "@/lib/export/excel";
import { buildTablePdfBuffer } from "@/lib/export/pdf";
import { fileResponse, EXCEL_CONTENT_TYPE, PDF_CONTENT_TYPE } from "@/lib/export/response";
import type { ExportColumn } from "@/lib/export/types";

type Row = {
  date: string;
  product: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  lineProfit: string;
  recordedBy: string;
};

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const format = request.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const [t, tExport, locale] = await Promise.all([
    getTranslations("sales"),
    getTranslations("export"),
    getLocale(),
  ]);

  const columns: ExportColumn<Row>[] = [
    { header: t("date"), accessor: (r) => r.date },
    { header: t("product"), accessor: (r) => r.product },
    { header: t("quantity"), accessor: (r) => String(r.quantity) },
    { header: t("unitPrice"), accessor: (r) => r.unitPrice },
    { header: t("total"), accessor: (r) => r.lineTotal },
    { header: t("profit"), accessor: (r) => r.lineProfit },
    { header: t("recordedBy"), accessor: (r) => r.recordedBy },
  ];

  const sales = await prisma.sale.findMany({
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const dateFormatter = new Intl.DateTimeFormat(user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const rows: Row[] = sales.flatMap((sale) =>
    sale.items.map((item) => ({
      date: dateFormatter.format(sale.createdAt),
      product: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      lineTotal: (item.quantity * Number(item.unitPrice)).toFixed(2),
      lineProfit: (item.quantity * (Number(item.unitPrice) - Number(item.unitCost))).toFixed(2),
      recordedBy: sale.user.name,
    }))
  );

  const dateLabel = tExport("generatedAt", {
    date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
  });

  if (format === "pdf") {
    const buffer = await buildTablePdfBuffer(t("title"), columns, rows, dateLabel);
    return fileResponse(buffer, "sales.pdf", PDF_CONTENT_TYPE);
  }

  const buffer = await buildExcelBuffer(t("title"), columns, rows);
  return fileResponse(buffer, "sales.xlsx", EXCEL_CONTENT_TYPE);
}
