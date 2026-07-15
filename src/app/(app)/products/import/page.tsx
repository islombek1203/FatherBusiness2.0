import Link from "next/link";
import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ImportForm } from "./import-form";

export default async function ImportProductsPage() {
  const t = await getTranslations("import");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground max-w-xl text-sm">{t("description")}</p>
      <Button variant="outline" size="sm" className="w-fit" render={<Link href="/api/export/products?format=xlsx" prefetch={false} />}>
        <Download />
        {t("downloadTemplate")}
      </Button>
      <ImportForm />
    </div>
  );
}
