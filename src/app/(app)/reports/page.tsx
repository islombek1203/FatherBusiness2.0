import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBusinessMonthRange } from "@/lib/date-range";
import { formatCurrency, UNIT_LABEL } from "@/lib/format";
import { getTotalStock } from "@/lib/stock";

function toDateInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(date);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; category?: string }>;
}) {
  const session = await auth();
  const { from, to, category } = await searchParams;
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");
  const tProducts = await getTranslations("products");

  const defaultRange = getBusinessMonthRange();
  const parsedStart = from ? new Date(`${from}T00:00:00+05:00`) : null;
  const parsedEnd = to ? new Date(`${to}T24:00:00+05:00`) : null;
  // Fall back to the default range on a malformed ?from=/?to= rather than
  // handing Prisma an Invalid Date (which would surface as a 500 page).
  const rangeStart = parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : defaultRange.start;
  const rangeEnd = parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd : defaultRange.end;

  const [items, categories, stockProducts] = await Promise.all([
    prisma.saleItem.findMany({
      where: {
        sale: { createdAt: { gte: rangeStart, lt: rangeEnd } },
        ...(category ? { product: { categoryId: category } } : {}),
      },
      include: { product: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { isActive: true, categoryId: category || undefined },
      orderBy: { name: "asc" },
    }),
  ]);

  type Row = {
    productId: string;
    name: string;
    color: string;
    sku: string;
    quantity: number;
    revenue: number;
    profit: number;
  };
  const byProduct = new Map<string, Row>();
  for (const item of items) {
    const existing = byProduct.get(item.productId) ?? {
      productId: item.productId,
      name: item.product.name,
      color: item.product.color,
      sku: item.product.sku,
      quantity: 0,
      revenue: 0,
      profit: 0,
    };
    existing.quantity += item.quantity;
    existing.revenue += item.quantity * Number(item.unitPrice);
    existing.profit += item.quantity * (Number(item.unitPrice) - Number(item.unitCost));
    byProduct.set(item.productId, existing);
  }
  const rows = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);
  const totals = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      profit: acc.profit + row.profit,
      quantity: acc.quantity + row.quantity,
    }),
    { revenue: 0, profit: 0, quantity: 0 }
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <form className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">{t("from")}</Label>
          <Input id="from" name="from" type="date" defaultValue={from ?? toDateInputValue(defaultRange.start)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">{t("to")}</Label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={to ?? toDateInputValue(new Date(defaultRange.end.getTime() - 1))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">{t("category")}</Label>
          <select
            id="category"
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
        </div>
        <Button type="submit" variant="outline" size="sm">
          {t("apply")}
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">{t("totalRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatCurrency(totals.revenue, session!.user.locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">{t("totalProfit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatCurrency(totals.profit, session!.user.locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">{t("unitsSold")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {totals.quantity} {UNIT_LABEL}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("unitsSold")}</TableHead>
              <TableHead>{t("revenue")}</TableHead>
              <TableHead>{t("profit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  {t("noData")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.productId}>
                <TableCell className="font-medium">
                  {row.name} ({tCommon(`colors.${row.color}`)}){" "}
                  <span className="text-muted-foreground font-mono text-xs">({row.sku})</span>
                </TableCell>
                <TableCell>
                  {row.quantity} {UNIT_LABEL}
                </TableCell>
                <TableCell>{formatCurrency(row.revenue, session!.user.locale)}</TableCell>
                <TableCell className="text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(row.profit, session!.user.locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <h2 className="text-xl font-semibold">{t("stockByLocation")}</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{tProducts("storeStock")}</TableHead>
              <TableHead>{tProducts("homeStock")}</TableHead>
              <TableHead>{tProducts("totalStock")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  {t("noData")}
                </TableCell>
              </TableRow>
            )}
            {stockProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.name} ({tCommon(`colors.${product.color}`)}){" "}
                  <span className="text-muted-foreground font-mono text-xs">({product.sku})</span>
                </TableCell>
                <TableCell>
                  {product.storeStock} {UNIT_LABEL}
                </TableCell>
                <TableCell>
                  {product.homeStock} {UNIT_LABEL}
                </TableCell>
                <TableCell className="font-medium">
                  {getTotalStock(product)} {UNIT_LABEL}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
