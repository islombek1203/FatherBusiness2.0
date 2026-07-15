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

type Row = { productId: string; quantity: string; unitPrice: string };
type ProductOption = { id: string; name: string; sku: string; unit: string; currentStock: number; sellingPrice: string };

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function SaleForm({
  action,
  products,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  products: ProductOption[];
}) {
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("formErrors");
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false, error: "idle" });
  const [rows, setRows] = useState<Row[]>([{ productId: "", quantity: "1", unitPrice: "" }]);

  const fieldErrors = !state.ok ? state.fieldErrors : undefined;
  const itemsError = fieldErrors?.items?.[0];
  const isInsufficientStock = !state.ok && state.error === "insufficientStock";

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateRow(index, { productId, unitPrice: product ? product.sellingPrice : "" });
  }

  function addRow() {
    setRows((prev) => [...prev, { productId: "", quantity: "1", unitPrice: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const serializedItems = JSON.stringify(
    rows.map((row) => ({
      productId: row.productId,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
    }))
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="items" value={serializedItems} />

      {isInsufficientStock && (
        <p role="alert" className="text-destructive text-sm">
          {t("insufficientStock")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label>{t("items")}</Label>
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const product = products.find((p) => p.id === row.productId);
            return (
              <div
                key={index}
                data-testid="item-row"
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-end"
              >
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label className="text-xs">{t("product")}</Label>
                  <Select value={row.productId} onValueChange={(value) => selectProduct(index, value ?? "")}>
                    <SelectTrigger className="w-full" data-testid="item-product-select">
                      <SelectValue placeholder={t("selectProduct")} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {p.currentStock} {p.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {product && (
                    <span className="text-muted-foreground text-xs">
                      {t("available")}: {product.currentStock} {product.unit}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 sm:w-28">
                  <Label className="text-xs">{t("quantity")}</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    max={product?.currentStock}
                    data-testid="item-quantity"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:w-32">
                  <Label className="text-xs">{t("unitPrice")}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    data-testid="item-unit-price"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
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
            );
          })}
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
