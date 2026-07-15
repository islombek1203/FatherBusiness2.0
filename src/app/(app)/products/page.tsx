import Link from "next/link";
import { Plus, Search, Upload } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButtons } from "@/components/export-buttons";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { setProductActive } from "./actions";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await auth();
  const { q, category } = await searchParams;
  const t = await getTranslations("products");
  const tCommon = await getTranslations("common");
  const tExport = await getTranslations("export");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: category || undefined,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { sku: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const canWrite = session!.user.role !== "VIEWER";
  const currencyFormatter = new Intl.NumberFormat(session!.user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons
            baseHref="/api/export/products"
            excelLabel={tExport("excel")}
            pdfLabel={tExport("pdf")}
          />
          {canWrite && (
            <Button variant="outline" render={<Link href="/products/import" />}>
              <Upload />
              {t("import")}
            </Button>
          )}
          {canWrite && (
            <Button render={<Link href="/products/new" />}>
              <Plus />
              {t("new")}
            </Button>
          )}
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <div className="flex max-w-sm flex-1 items-center gap-2">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <Input name="q" defaultValue={q} placeholder={tCommon("search")} />
        </div>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          {tCommon("filter")}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sku")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("category")}</TableHead>
              <TableHead>{t("stock")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("sellingPrice")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="text-muted-foreground font-mono text-xs">{product.sku}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {product.name}
                    {!product.isActive && <Badge variant="secondary">{tCommon("inactive")}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {product.category.name}
                </TableCell>
                <TableCell>
                  {product.currentStock} {product.unit}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {currencyFormatter.format(Number(product.sellingPrice))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {canWrite && <AdjustStockDialog productId={product.id} currentStock={product.currentStock} />}
                    {canWrite && (
                      <Button variant="ghost" size="sm" render={<Link href={`/products/${product.id}/edit`} />}>
                        {tCommon("edit")}
                      </Button>
                    )}
                    {canWrite && (
                      <form
                        action={async () => {
                          "use server";
                          await setProductActive(product.id, !product.isActive);
                        }}
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          {product.isActive ? tCommon("deactivate") : tCommon("activate")}
                        </Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
