"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import { adjustProductStock } from "./actions";

function SubmitButton() {
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("loading") : t("save")}
    </Button>
  );
}

export function AdjustStockDialog({ productId, currentStock }: { productId: string; currentStock: number }) {
  const t = useTranslations("inventory");
  const tErrors = useTranslations("formErrors");
  const [open, setOpen] = useState(false);
  // A non-ok sentinel (rather than `{ ok: true }`) as the initial state, so
  // the very first render can't be mistaken for "the action just succeeded"
  // and close the dialog before the user has submitted anything.
  const [state, formAction] = useActionState<ActionResult, FormData>(adjustProductStock, {
    ok: false,
    error: "idle",
  });

  // Close the dialog once the action succeeds. Adjusting state during render
  // (guarded by comparing against the previous state) is the sanctioned
  // alternative to a useEffect here — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) setOpen(false);
  }

  const quantityError = !state.ok ? state.fieldErrors?.quantityAfter?.[0] : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" data-testid="adjust-stock-trigger" />}>
        <PackageSearch />
        {t("adjustStock")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("adjustStock")}</DialogTitle>
          <DialogDescription>{t("adjustStockDescription", { current: currentStock })}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="productId" value={productId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantityAfter">{t("newQuantity")}</Label>
            <Input
              id="quantityAfter"
              name="quantityAfter"
              type="number"
              min="0"
              step="1"
              defaultValue={currentStock}
              required
              aria-invalid={!!quantityError}
            />
            {quantityError && (
              <p role="alert" className="text-destructive text-sm">
                {tErrors(quantityError)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note">{t("reason")}</Label>
            <Textarea id="note" name="note" rows={2} />
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
