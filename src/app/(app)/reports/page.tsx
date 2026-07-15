import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBusinessMonthRange } from "@/lib/date-range";

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

  const defaultRange = getBusinessMonthRange();
  const rangeStart = from ? new Date(`${from}T00:00:00+05:00`) : defaultRange.start;
  const rangeEnd = to ? new Date(`${to}T24:00:00+05:00`) : defaultRange.end;

  const [items, categories] = await Promise.all([
    prisma.saleItem.findMany({
      where: {
        sale: { createdAt: { gte: rangeStart, lt: rangeEnd } },
        ...(category ? { product: { categoryId: category } } : {}),
      },
      include: { product: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  type Row = { productId: string; name: string; sku: string; quantity: number; revenue: number; profit: number };
  const byProduct = new Map<string, Row>();
  for (const item of items) {
    const existing = byProduct.get(item.productId) ?? {
      productId: item.productId,
      name: item.product.name,
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

  const currencyFormatter = new Intl.NumberFormat(session!.user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    style: "currency",
    currency: "USD",
  });

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
            <p className="text-xl font-semibold">{currencyFormatter.format(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">{t("totalProfit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{currencyFormatter.format(totals.profit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-xs font-medium">{t("unitsSold")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{totals.quantity}</p>
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
                  {row.name} <span className="text-muted-foreground font-mono text-xs">({row.sku})</span>
                </TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{currencyFormatter.format(row.revenue)}</TableCell>
                <TableCell className="text-emerald-700 dark:text-emerald-400">
                  {currencyFormatter.format(row.profit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
