"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate, type LoginState } from "./actions";

function SubmitButton() {
  const t = useTranslations("auth");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t("signingIn") : t("signIn")}
    </Button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations("auth");
  const boundAuthenticate = authenticate.bind(null, callbackUrl);
  const [state, formAction] = useActionState<LoginState, FormData>(boundAuthenticate, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error === "invalid" && (
        <p role="alert" className="text-destructive text-sm">
          {t("invalidCredentials")}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
