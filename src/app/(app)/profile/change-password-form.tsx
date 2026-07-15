"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import { changeOwnPassword } from "./actions";

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations("profile");
  const tErrors = useTranslations("formErrors");
  const router = useRouter();
  const [state, formAction] = useActionState<ActionResult, FormData>(changeOwnPassword, { ok: false, error: "idle" });

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) {
      // Changing the password invalidates every session, including this
      // one — send the user back to /login rather than showing a page that
      // will immediately 401 on the next navigation.
      setTimeout(() => router.push("/login"), 1500);
    }
  }

  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!fieldErrors?.currentPassword}
        />
        {fieldErrors?.currentPassword?.[0] && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(fieldErrors.currentPassword[0])}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">{t("newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!fieldErrors?.newPassword}
        />
        {fieldErrors?.newPassword?.[0] && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(fieldErrors.newPassword[0])}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!fieldErrors?.confirmPassword}
        />
        {fieldErrors?.confirmPassword?.[0] && (
          <p role="alert" className="text-destructive text-sm">
            {tErrors(fieldErrors.confirmPassword[0])}
          </p>
        )}
      </div>

      {state.ok && <p className="text-sm text-emerald-700 dark:text-emerald-400">{t("passwordChanged")}</p>}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
