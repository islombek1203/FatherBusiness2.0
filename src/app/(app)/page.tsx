import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessDayRange, getBusinessMonthRange } from "@/lib/date-range";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");

  const { start: todayStart, end: todayEnd } = getBusinessDayRange();
  const { start: monthStart, end: monthEnd } = getBusinessMonthRange();

  const [todaySales, monthSales, activeProductCount, outOfStockCount, recentSales] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
      _sum: { totalAmount: true, totalProfit: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
      _sum: { totalAmount: true, totalProfit: true },
      _count: true,
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, currentStock: 0 } }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true, user: true },
    }),
  ]);

  const currencyFormatter = new Intl.NumberFormat(session.user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    style: "currency",
    currency: "USD",
  });
  const dateFormatter = new Intl.DateTimeFormat(session.user.locale === "UZ_LATN" ? "uz-Latn" : "uz-Cyrl", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const stats = [
    {
      key: "todaySales",
      value: currencyFormatter.format(Number(todaySales._sum.totalAmount ?? 0)),
      sub: t("salesCount", { count: todaySales._count }),
    },
    {
      key: "todayProfit",
      value: currencyFormatter.format(Number(todaySales._sum.totalProfit ?? 0)),
    },
    {
      key: "monthSales",
      value: currencyFormatter.format(Number(monthSales._sum.totalAmount ?? 0)),
      sub: t("salesCount", { count: monthSales._count }),
    },
    {
      key: "monthProfit",
      value: currencyFormatter.format(Number(monthSales._sum.totalProfit ?? 0)),
    },
    { key: "activeProducts", value: String(activeProductCount) },
    { key: "outOfStock", value: String(outOfStockCount) },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{tNav("dashboard")}</h1>
        <p className="text-muted-foreground text-sm">{t("welcome", { name: session.user.name })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="pb-1">
              <CardTitle className="text-muted-foreground text-xs font-medium">{t(`stats.${stat.key}`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{stat.value}</p>
              {"sub" in stat && stat.sub && <p className="text-muted-foreground text-xs">{stat.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentSales")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noRecentSales")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-0">
                  <span className="text-muted-foreground">{dateFormatter.format(sale.createdAt)}</span>
                  <span>
                    {t("itemsCount", { count: sale.items.length })} · {sale.user.name}
                  </span>
                  <span className="font-medium">{currencyFormatter.format(Number(sale.totalAmount))}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/sales" className="text-primary mt-3 inline-block text-sm hover:underline">
            {t("viewAllSales")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
