import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { updateSupplier } from "../../actions";
import { SupplierForm } from "../../supplier-form";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const t = await getTranslations("suppliers");
  const boundAction = updateSupplier.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <SupplierForm action={boundAction} defaultValues={supplier} />
    </div>
  );
}
