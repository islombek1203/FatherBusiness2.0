import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setCategoryActive } from "./actions";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;
  const t = await getTranslations("categories");
  const tCommon = await getTranslations("common");

  const categories = await prisma.category.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const canWrite = session!.user.role !== "VIEWER";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {canWrite && (
          <Button render={<Link href="/categories/new" />}>
            <Plus />
            {t("new")}
          </Button>
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
              <TableHead>{t("productCount")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {category.name}
                    {!category.isActive && <Badge variant="secondary">{tCommon("inactive")}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden max-w-xs truncate sm:table-cell">
                  {category.description}
                </TableCell>
                <TableCell>{category._count.products}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canWrite && (
                      <Button variant="ghost" size="sm" render={<Link href={`/categories/${category.id}/edit`} />}>
                        {tCommon("edit")}
                      </Button>
                    )}
                    {canWrite && (
                      <form
                        action={async () => {
                          "use server";
                          await setCategoryActive(category.id, !category.isActive);
                        }}
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          {category.isActive ? tCommon("deactivate") : tCommon("activate")}
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
