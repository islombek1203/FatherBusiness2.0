import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{tNav("dashboard")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("welcome", { name: session.user.name })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
