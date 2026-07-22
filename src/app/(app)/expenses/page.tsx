import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButtons } from "@/components/export-buttons";
import { formatCurrency } from "@/lib/format";

const LIST_LIMIT = 100;

export default async function ExpensesPage() {
  const session = await auth();
  const t = await getTranslations("expenses");
  const tExport = await getTranslations("export");

  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    include: { expenseType: true, user: true },
  });

  const canWrite = session!.user.role !== "VIEWER";
  const dateFormatter = new Intl.DateTimeFormat(session!.user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons baseHref="/api/export/expenses" excelLabel={tExport("excel")} pdfLabel={tExport("pdf")} />
          {canWrite && (
            <Link href="/expenses/new" className={buttonVariants()}>
              <Plus />
              {t("new")}
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("amount")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("note")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("recordedBy")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  {t("noExpenses")}
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {dateFormatter.format(expense.createdAt)}
                </TableCell>
                <TableCell className="font-medium">{expense.expenseType.name}</TableCell>
                <TableCell>{formatCurrency(expense.amount.toString(), session!.user.locale)}</TableCell>
                <TableCell className="text-muted-foreground hidden max-w-xs truncate md:table-cell">
                  {expense.note}
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{expense.user.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
