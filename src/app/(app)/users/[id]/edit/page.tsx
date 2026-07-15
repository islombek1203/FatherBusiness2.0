import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { updateUser } from "../../actions";
import { UserForm } from "../../user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const t = await getTranslations("users");
  const boundAction = updateUser.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <UserForm
        action={boundAction}
        mode="edit"
        defaultValues={{ name: user.name, email: user.email, role: user.role }}
      />
    </div>
  );
}
