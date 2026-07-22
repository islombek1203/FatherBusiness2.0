"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function ExpenseTypeForm({
  action,
  defaultValues,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: { name: string; description: string | null };
}) {
  const t = useTranslations("expenseTypes");
  const tErrors = useTranslations("formErrors");
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: true });

  const nameError = !state.ok ? state.fieldErrors?.name?.[0] : undefined;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required aria-invalid={!!nameError} />
        {nameError && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(nameError)}
          </p>
        )}
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
