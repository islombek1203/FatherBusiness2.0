"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import { updateProfile } from "./actions";

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const t = useTranslations("profile");
  const tErrors = useTranslations("formErrors");
  const [state, formAction] = useActionState<ActionResult, FormData>(updateProfile, { ok: true });
  const nameError = !state.ok ? state.fieldErrors?.name?.[0] : undefined;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" defaultValue={name} required aria-invalid={!!nameError} />
        {nameError && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(nameError)}
          </p>
        )}
      </div>
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
