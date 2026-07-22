"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";
import { STOCK_LOCATIONS } from "@/lib/validation/product";
import type { StockLocation } from "@/generated/prisma/enums";

type Row = { productId: string; location: StockLocation; quantity: string; unitCost: string };
type ProductOption = { id: string; name: string; sku: string; color: string };

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function PurchaseForm({
  action,
  suppliers,
  products,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  suppliers: { id: string; name: string }[];
  products: ProductOption[];
}) {
  const t = useTranslations("purchases");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("formErrors");
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false, error: "idle" });
  const [rows, setRows] = useState<Row[]>([{ productId: "", location: "STORE", quantity: "1", unitCost: "" }]);

  const fieldErrors = !state.ok ? state.fieldErrors : undefined;
  const itemsError = fieldErrors?.items?.[0];

  function productLabel(product: ProductOption) {
    return `${product.name} (${tCommon(`colors.${product.color}`)}) (${product.sku})`;
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { productId: "", location: "STORE", quantity: "1", unitCost: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const serializedItems = JSON.stringify(
    rows.map((row) => ({
      productId: row.productId,
      location: row.location,
      quantity: Number(row.quantity),
      unitCost: Number(row.unitCost),
    }))
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="items" value={serializedItems} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="supplierId">{t("supplier")}</Label>
        <Select
          name="supplierId"
          items={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))}
        >
          <SelectTrigger id="supplierId" className="w-full" aria-invalid={!!fieldErrors?.supplierId}>
            <SelectValue placeholder={t("selectSupplier")} />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors?.supplierId?.[0] && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(fieldErrors.supplierId[0])}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("items")}</Label>
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <div
              key={index}
              data-testid="item-row"
              className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-end sm:flex-wrap"
            >
              <div className="flex flex-1 flex-col gap-1.5 sm:min-w-48">
                <Label className="text-xs">{t("product")}</Label>
                <Select
                  value={row.productId}
                  onValueChange={(value) => updateRow(index, { productId: value ?? "" })}
                  items={products.map((product) => ({
                    value: product.id,
                    label: productLabel(product),
                  }))}
                >
                  <SelectTrigger className="w-full" data-testid="item-product-select">
                    <SelectValue placeholder={t("selectProduct")} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {productLabel(product)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:w-36">
                <Label className="text-xs">{t("location")}</Label>
                <Select
                  value={row.location}
                  onValueChange={(value) => value && updateRow(index, { location: value as StockLocation })}
                  items={STOCK_LOCATIONS.map((location) => ({ value: location, label: tCommon(`locations.${location}`) }))}
                >
                  <SelectTrigger className="w-full" data-testid="item-location-select">
                    <SelectValue placeholder={t("selectLocation")} />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {tCommon(`locations.${location}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:w-28">
                <Label className="text-xs">{t("quantity")}</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  data-testid="item-quantity"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:w-32">
                <Label className="text-xs">{t("unitCost")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  data-testid="item-unit-cost"
                  value={row.unitCost}
                  onChange={(e) => updateRow(index, { unitCost: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                disabled={rows.length === 1}
                aria-label={tCommon("delete")}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        {itemsError && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(itemsError)}
          </p>
        )}
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
          <Plus />
          {t("addItem")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">{t("note")}</Label>
        <Textarea id="note" name="note" rows={2} />
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
