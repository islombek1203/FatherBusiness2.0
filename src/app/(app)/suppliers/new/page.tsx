import { getTranslations } from "next-intl/server";
import { createSupplier } from "../actions";
import { SupplierForm } from "../supplier-form";

export default async function NewSupplierPage() {
  const t = await getTranslations("suppliers");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <SupplierForm action={createSupplier} />
    </div>
  );
}
