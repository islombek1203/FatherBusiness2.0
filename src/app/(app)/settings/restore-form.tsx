"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRMATION_PHRASE = "RESTORE";

type Status = "idle" | "submitting" | "error" | "success";

export function RestoreForm() {
  const t = useTranslations("settings");
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorKey(null);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/restore", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setErrorKey(body.error ?? "restoreFailed");
        setStatus("error");
        return;
      }
      setStatus("success");
      // A full restore replaces the sessions table too, so the current
      // session is no longer valid — send the admin back to /login.
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setErrorKey("restoreFailed");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <p className="text-destructive text-sm font-medium">{t("restoreWarning")}</p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="restore-file">{t("backupFile")}</Label>
        <Input id="restore-file" name="file" type="file" accept=".dump" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmation">{t("typeToConfirm", { phrase: CONFIRMATION_PHRASE })}</Label>
        <Input
          id="confirmation"
          name="confirmation"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-destructive text-sm">
          {t(`errors.${errorKey}`)}
        </p>
      )}
      {status === "success" && <p className="text-sm text-emerald-700 dark:text-emerald-400">{t("restoreSuccess")}</p>}

      <div>
        <Button
          type="submit"
          variant="destructive"
          disabled={confirmation !== CONFIRMATION_PHRASE || status === "submitting" || status === "success"}
        >
          {status === "submitting" ? t("restoring") : t("restore")}
        </Button>
      </div>
    </form>
  );
}
