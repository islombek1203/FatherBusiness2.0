import Link from "next/link";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Button variant="outline" size="sm" render={<Link href={`${baseHref}?format=xlsx`} prefetch={false} />}>
        <FileSpreadsheet />
        {excelLabel}
      </Button>
      <Button variant="outline" size="sm" render={<Link href={`${baseHref}?format=pdf`} prefetch={false} />}>
        <FileText />
        {pdfLabel}
      </Button>
    </div>
  );
}
