"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";

type SupplierDefaults = {
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
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

export function SupplierForm({
  action,
  defaultValues,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: SupplierDefaults;
}) {
  const t = useTranslations("suppliers");
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: true });
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required aria-invalid={!!fieldErrors?.name} />
        <FieldError messages={fieldErrors?.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contactPerson">{t("contactPerson")}</Label>
        <Input id="contactPerson" name="contactPerson" defaultValue={defaultValues?.contactPerson ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          aria-invalid={!!fieldErrors?.email}
        />
        <FieldError messages={fieldErrors?.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">{t("address")}</Label>
        <Textarea id="address" name="address" defaultValue={defaultValues?.address ?? ""} rows={2} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} rows={3} />
      </div>
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
