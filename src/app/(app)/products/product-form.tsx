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

type ProductDefaults = {
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  sellingPrice: string;
  categoryId: string;
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
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit">{t("unit")}</Label>
          <Input id="unit" name="unit" defaultValue={defaultValues?.unit ?? "dona"} required />
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
      </div>
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
