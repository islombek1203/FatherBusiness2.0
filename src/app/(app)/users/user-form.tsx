"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";
import type { Role } from "@/generated/prisma/enums";

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

export function UserForm({
  action,
  mode,
  defaultValues,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  mode: "create" | "edit";
  defaultValues?: { name: string; email: string; role: Role };
}) {
  const t = useTranslations("users");
  const tRoles = useTranslations("roles");
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: true });
  const fieldErrors = !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required aria-invalid={!!fieldErrors?.name} />
        <FieldError messages={fieldErrors?.name} />
      </div>

      {mode === "create" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required aria-invalid={!!fieldErrors?.email} />
          <FieldError messages={fieldErrors?.email} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label>{t("email")}</Label>
          <p className="text-muted-foreground text-sm">{defaultValues?.email}</p>
        </div>
      )}

      {mode === "create" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={!!fieldErrors?.password}
          />
          <FieldError messages={fieldErrors?.password} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="role">{t("role")}</Label>
        <Select name="role" defaultValue={defaultValues?.role ?? "STAFF"}>
          <SelectTrigger id="role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">{tRoles("ADMIN")}</SelectItem>
            <SelectItem value="STAFF">{tRoles("STAFF")}</SelectItem>
            <SelectItem value="VIEWER">{tRoles("VIEWER")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!state.ok && state.error === "lastAdmin" && (
        <p role="alert" className="text-destructive text-sm">
          {t("errors.lastAdmin")}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
