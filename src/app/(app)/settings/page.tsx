import Link from "next/link";
import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestoreForm } from "./restore-form";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("backup")}</CardTitle>
          <CardDescription>{t("backupDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/api/backup" prefetch={false} />}>
            <Download />
            {t("downloadBackup")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("restore")}</CardTitle>
          <CardDescription>{t("restoreDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RestoreForm />
        </CardContent>
      </Card>
    </div>
  );
}
