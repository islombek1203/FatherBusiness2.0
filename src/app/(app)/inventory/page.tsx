import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButtons } from "@/components/export-buttons";
import { UNIT_LABEL } from "@/lib/format";

const HISTORY_LIMIT = 200;

export default async function InventoryHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const session = await auth();
  const { product: productId } = await searchParams;
  const t = await getTranslations("inventory");
  const tCommon = await getTranslations("common");
  const tExport = await getTranslations("export");

  const entries = await prisma.inventoryHistory.findMany({
    where: productId ? { productId } : undefined,
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  const dateFormatter = new Intl.DateTimeFormat(session!.user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const typeVariant: Record<string, "default" | "secondary" | "outline"> = {
    PURCHASE: "default",
    SALE: "secondary",
    ADJUSTMENT: "outline",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <ExportButtons
          baseHref="/api/export/inventory-history"
          excelLabel={tExport("excel")}
          pdfLabel={tExport("pdf")}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("location")}</TableHead>
              <TableHead>{t("quantityBefore")}</TableHead>
              <TableHead>{t("quantityAfter")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("user")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("reason")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground text-center">
                  {t("noHistory")}
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {dateFormatter.format(entry.createdAt)}
                </TableCell>
                <TableCell className="font-medium">
                  {entry.product.name} ({tCommon(`colors.${entry.product.color}`)})
                </TableCell>
                <TableCell>
                  <Badge variant={typeVariant[entry.type]}>{t(`types.${entry.type}`)}</Badge>
                </TableCell>
                <TableCell>{tCommon(`locations.${entry.location}`)}</TableCell>
                <TableCell>
                  {entry.quantityBefore} {UNIT_LABEL}
                </TableCell>
                <TableCell>
                  {entry.quantityAfter} {UNIT_LABEL}
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{entry.user.name}</TableCell>
                <TableCell className="text-muted-foreground hidden max-w-xs truncate md:table-cell">
                  {entry.note}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
