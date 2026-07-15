import { getTranslations } from "next-intl/server";
import { createUser } from "../actions";
import { UserForm } from "../user-form";

export default async function NewUserPage() {
  const t = await getTranslations("users");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <UserForm action={createUser} mode="create" />
    </div>
  );
}
