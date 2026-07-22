"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
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
import { UNIT_LABEL } from "@/lib/format";
import { PRODUCT_COLORS, STOCK_LOCATIONS } from "@/lib/validation/product";

type ProductDefaults = {
  sku: string;
  name: string;
  description: string | null;
  sellingPrice: string;
  categoryId: string;
  color: (typeof PRODUCT_COLORS)[number];
};

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  const tErrors = useTranslations("formErrors");
  if (!messages?.[0]) return null;
  return (
    <p role="alert" className="text-destructive text-sm">
      {tErrors(messages[0])}
    </p>
  );
}

export function ProductForm({
  action,
  categories,
  defaultValues,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  categories: { id: string; name: string }[];
  defaultValues?: ProductDefaults;
}) {
  const t = useTranslations("products");
  const tColors = useTranslations("common.colors");
  const tLocations = useTranslations("common.locations");
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: true });
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sku">{t("sku")}</Label>
        <Input id="sku" name="sku" defaultValue={defaultValues?.sku} required aria-invalid={!!fieldErrors?.sku} />
        <FieldError messages={fieldErrors?.sku} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required aria-invalid={!!fieldErrors?.name} />
        <FieldError messages={fieldErrors?.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">{t("category")}</Label>
        <Select
          name="categoryId"
          defaultValue={defaultValues?.categoryId}
          items={categories.map((category) => ({ value: category.id, label: category.name }))}
        >
          <SelectTrigger id="categoryId" className="w-full" aria-invalid={!!fieldErrors?.categoryId}>
            <SelectValue placeholder={t("selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={fieldErrors?.categoryId} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="color">{t("color")}</Label>
        <Select
          name="color"
          defaultValue={defaultValues?.color}
          items={PRODUCT_COLORS.map((color) => ({ value: color, label: tColors(color) }))}
        >
          <SelectTrigger id="color" className="w-full" aria-invalid={!!fieldErrors?.color}>
            <SelectValue placeholder={t("selectColor")} />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                {tColors(color)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={fieldErrors?.color} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="unit">{t("unit")}</Label>
        <Input id="unit" name="unit" value={UNIT_LABEL} disabled readOnly />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sellingPrice">{t("sellingPrice")}</Label>
        <Input
          id="sellingPrice"
          name="sellingPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.sellingPrice}
          required
          aria-invalid={!!fieldErrors?.sellingPrice}
        />
        <FieldError messages={fieldErrors?.sellingPrice} />
      </div>
      {!defaultValues && (
        // Create-only: how many you already have on hand. Editing an
        // existing product's stock goes through "Adjust stock" instead,
        // which keeps a reason and shows up in the inventory history —
        // silently changing it from the edit form would bypass that trail.
        <div className="flex flex-col gap-2">
          <Label htmlFor="initialStock">{t("initialStock")}</Label>
          <Input
            id="initialStock"
            name="initialStock"
            type="number"
            step="1"
            min="0"
            defaultValue="0"
            aria-invalid={!!fieldErrors?.initialStock}
          />
          <FieldError messages={fieldErrors?.initialStock} />
        </div>
      )}
      {!defaultValues && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="initialStockLocation">{t("location")}</Label>
          <Select
            name="initialStockLocation"
            defaultValue="STORE"
            items={STOCK_LOCATIONS.map((location) => ({ value: location, label: tLocations(location) }))}
          >
            <SelectTrigger id="initialStockLocation" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCK_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {tLocations(location)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} rows={3} />
      </div>
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
