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

export default async function PurchasesPage() {
  const session = await auth();
  const t = await getTranslations("purchases");
  const tExport = await getTranslations("export");

  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    include: { supplier: true, user: true, items: true },
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
          <ExportButtons
            baseHref="/api/export/purchases"
            excelLabel={tExport("excel")}
            pdfLabel={tExport("pdf")}
          />
          {canWrite && (
            <Link href="/purchases/new" className={buttonVariants()}>
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
              <TableHead>{t("supplier")}</TableHead>
              <TableHead>{t("itemCount")}</TableHead>
              <TableHead>{t("total")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("recordedBy")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  {t("noPurchases")}
                </TableCell>
              </TableRow>
            )}
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {dateFormatter.format(purchase.createdAt)}
                </TableCell>
                <TableCell className="font-medium">{purchase.supplier.name}</TableCell>
                <TableCell>{purchase.items.length}</TableCell>
                <TableCell>{formatCurrency(purchase.totalAmount.toString(), session!.user.locale)}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{purchase.user.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
