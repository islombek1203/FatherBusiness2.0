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
  supplier: string;
  product: string;
  location: string;
  quantity: number;
  unitCost: string;
  lineTotal: string;
  recordedBy: string;
};

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const format = request.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const [t, tCommon, tExport, locale] = await Promise.all([
    getTranslations("purchases"),
    getTranslations("common"),
    getTranslations("export"),
    getLocale(),
  ]);

  const columns: ExportColumn<Row>[] = [
    { header: t("date"), accessor: (r) => r.date },
    { header: t("supplier"), accessor: (r) => r.supplier },
    { header: t("product"), accessor: (r) => r.product },
    { header: t("location"), accessor: (r) => r.location },
    { header: t("quantity"), accessor: (r) => String(r.quantity) },
    { header: t("unitCost"), accessor: (r) => r.unitCost },
    { header: t("total"), accessor: (r) => r.lineTotal },
    { header: t("recordedBy"), accessor: (r) => r.recordedBy },
  ];

  const purchases = await prisma.purchase.findMany({
    include: { supplier: true, user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const dateFormatter = new Intl.DateTimeFormat(user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const rows: Row[] = purchases.flatMap((purchase) =>
    purchase.items.map((item) => ({
      date: dateFormatter.format(purchase.createdAt),
      supplier: purchase.supplier.name,
      product: `${item.product.name} (${tCommon(`colors.${item.product.color}`)})`,
      location: tCommon(`locations.${item.location}`),
      quantity: item.quantity,
      unitCost: item.unitCost.toString(),
      lineTotal: (item.quantity * Number(item.unitCost)).toFixed(2),
      recordedBy: purchase.user.name,
    }))
  );

  const dateLabel = tExport("generatedAt", {
    date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
  });

  if (format === "pdf") {
    const buffer = await buildTablePdfBuffer(t("title"), columns, rows, dateLabel);
    return fileResponse(buffer, "purchases.pdf", PDF_CONTENT_TYPE);
  }

  const buffer = await buildExcelBuffer(t("title"), columns, rows);
  return fileResponse(buffer, "purchases.xlsx", EXCEL_CONTENT_TYPE);
}
