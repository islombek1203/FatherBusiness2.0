import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setExpenseTypeActive } from "./actions";

export default async function ExpenseTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;
  const t = await getTranslations("expenseTypes");
  const tCommon = await getTranslations("common");

  const expenseTypes = await prisma.expenseType.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { expenses: true } } },
  });

  const canWrite = session!.user.role !== "VIEWER";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {canWrite && (
          <Link href="/expense-types/new" className={buttonVariants()}>
            <Plus />
            {t("new")}
          </Link>
        )}
      </div>

      <form className="flex max-w-sm items-center gap-2">
        <Search className="text-muted-foreground size-4 shrink-0" />
        <Input name="q" defaultValue={q} placeholder={tCommon("search")} />
      </form>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("description")}</TableHead>
              <TableHead>{t("expenseCount")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {expenseTypes.map((expenseType) => (
              <TableRow key={expenseType.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {expenseType.name}
                    {!expenseType.isActive && <Badge variant="secondary">{tCommon("inactive")}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden max-w-xs truncate sm:table-cell">
                  {expenseType.description}
                </TableCell>
                <TableCell>{expenseType._count.expenses}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canWrite && (
                      <Link
                        href={`/expense-types/${expenseType.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        {tCommon("edit")}
                      </Link>
                    )}
                    {canWrite && (
                      <form
                        action={async () => {
                          "use server";
                          await setExpenseTypeActive(expenseType.id, !expenseType.isActive);
                        }}
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          {expenseType.isActive ? tCommon("deactivate") : tCommon("activate")}
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
