import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{tCommon("appName")}</CardTitle>
          <CardDescription>{t("signInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"} />
        </CardContent>
      </Card>
    </main>
  );
}
