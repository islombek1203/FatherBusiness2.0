import Link from "next/link";
import { FileSpreadsheet, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function ExportButtons({
  baseHref,
  excelLabel,
  pdfLabel,
}: {
  baseHref: string;
  excelLabel: string;
  pdfLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <Link
        href={`${baseHref}?format=xlsx`}
        prefetch={false}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <FileSpreadsheet />
        {excelLabel}
      </Link>
      <Link
        href={`${baseHref}?format=pdf`}
        prefetch={false}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <FileText />
        {pdfLabel}
      </Link>
    </div>
  );
}
