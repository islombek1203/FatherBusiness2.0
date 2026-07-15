import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setSupplierActive } from "./actions";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;
  const t = await getTranslations("suppliers");
  const tCommon = await getTranslations("common");

  const suppliers = await prisma.supplier.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { contactPerson: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });

  const canWrite = session!.user.role !== "VIEWER";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {canWrite && (
          <Button render={<Link href="/suppliers/new" />}>
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
              <TableHead className="hidden sm:table-cell">{t("contactPerson")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("phone")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            )}
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {supplier.name}
                    {!supplier.isActive && <Badge variant="secondary">{tCommon("inactive")}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {supplier.contactPerson}
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{supplier.phone}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canWrite && (
                      <Button variant="ghost" size="sm" render={<Link href={`/suppliers/${supplier.id}/edit`} />}>
                        {tCommon("edit")}
                      </Button>
                    )}
                    {canWrite && (
                      <form
                        action={async () => {
                          "use server";
                          await setSupplierActive(supplier.id, !supplier.isActive);
                        }}
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          {supplier.isActive ? tCommon("deactivate") : tCommon("activate")}
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
