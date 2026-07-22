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
  type: string;
  amount: string;
  note: string;
  recordedBy: string;
};

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const format = request.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const [t, tExport, locale] = await Promise.all([
    getTranslations("expenses"),
    getTranslations("export"),
    getLocale(),
  ]);

  const columns: ExportColumn<Row>[] = [
    { header: t("date"), accessor: (r) => r.date },
    { header: t("type"), accessor: (r) => r.type },
    { header: t("amount"), accessor: (r) => r.amount },
    { header: t("note"), accessor: (r) => r.note },
    { header: t("recordedBy"), accessor: (r) => r.recordedBy },
  ];

  const expenses = await prisma.expense.findMany({
    include: { expenseType: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  const dateFormatter = new Intl.DateTimeFormat(user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const rows: Row[] = expenses.map((expense) => ({
    date: dateFormatter.format(expense.createdAt),
    type: expense.expenseType.name,
    amount: expense.amount.toString(),
    note: expense.note ?? "",
    recordedBy: expense.user.name,
  }));

  const dateLabel = tExport("generatedAt", {
    date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
  });

  if (format === "pdf") {
    const buffer = await buildTablePdfBuffer(t("title"), columns, rows, dateLabel);
    return fileResponse(buffer, "expenses.pdf", PDF_CONTENT_TYPE);
  }

  const buffer = await buildExcelBuffer(t("title"), columns, rows);
  return fileResponse(buffer, "expenses.xlsx", EXCEL_CONTENT_TYPE);
}
