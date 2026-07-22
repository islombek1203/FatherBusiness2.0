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

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function ExpenseForm({
  action,
  expenseTypes,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  expenseTypes: { id: string; name: string }[];
}) {
  const t = useTranslations("expenses");
  const tErrors = useTranslations("formErrors");
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false, error: "idle" });
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="expenseTypeId">{t("type")}</Label>
        <Select
          name="expenseTypeId"
          items={expenseTypes.map((expenseType) => ({ value: expenseType.id, label: expenseType.name }))}
        >
          <SelectTrigger id="expenseTypeId" className="w-full" aria-invalid={!!fieldErrors?.expenseTypeId}>
            <SelectValue placeholder={t("selectType")} />
          </SelectTrigger>
          <SelectContent>
            {expenseTypes.map((expenseType) => (
              <SelectItem key={expenseType.id} value={expenseType.id}>
                {expenseType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors?.expenseTypeId?.[0] && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(fieldErrors.expenseTypeId[0])}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">{t("amount")}</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          aria-invalid={!!fieldErrors?.amount}
        />
        {fieldErrors?.amount?.[0] && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(fieldErrors.amount[0])}
          </p>
        )}
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
