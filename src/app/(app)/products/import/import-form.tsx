"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importProducts, type ImportResult } from "./actions";

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function ImportForm() {
  const t = useTranslations("import");
  const [state, formAction] = useActionState<ImportResult, FormData>(importProducts, {
    ok: false,
    error: "idle",
  });

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="file">{t("file")}</Label>
          <Input id="file" name="file" type="file" accept=".xlsx" required />
        </div>
        <div>
          <SubmitButton />
        </div>
      </form>

      {!state.ok && state.error !== "idle" && (
        <p role="alert" className="text-destructive text-sm">
          {t(`errors.${state.error}`)}
        </p>
      )}

      {state.ok && (
        <div className="rounded-md border p-4 text-sm">
          <p>{t("summary", { created: state.created, updated: state.updated })}</p>
          {state.errors.length > 0 && (
            <ul className="text-destructive mt-2 list-disc pl-5">
              {state.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
