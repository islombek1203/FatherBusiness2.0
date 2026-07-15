import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const t = await getTranslations("profile");
  const tRoles = await getTranslations("roles");

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("accountInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">{t("email")}: </span>
            {session!.user.email}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{t("role")}: </span>
            {tRoles(session!.user.role)}
          </div>
          <ProfileForm name={session!.user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
