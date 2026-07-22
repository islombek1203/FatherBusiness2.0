import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { setUserActive } from "./actions";

export default async function UsersPage() {
  const session = await auth();
  const t = await getTranslations("users");
  const tCommon = await getTranslations("common");
  const tRoles = await getTranslations("roles");

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link href="/users/new" className={buttonVariants()}>
          <Plus />
          {t("new")}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {u.name}
                    {u.id === session!.user.id && <Badge variant="outline">{t("you")}</Badge>}
                    {!u.isActive && <Badge variant="secondary">{tCommon("inactive")}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{u.email}</TableCell>
                <TableCell>{tRoles(u.role)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <ResetPasswordDialog userId={u.id} userName={u.name} />
                    <Link href={`/users/${u.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      {tCommon("edit")}
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await setUserActive(u.id, !u.isActive);
                      }}
                    >
                      <Button variant="ghost" size="sm" type="submit">
                        {u.isActive ? tCommon("deactivate") : tCommon("activate")}
                      </Button>
                    </form>
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
