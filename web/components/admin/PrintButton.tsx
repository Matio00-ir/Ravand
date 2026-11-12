"use client";

import { Button } from "@/components/admin/forms";

/** Prints the document on the page (the admin chrome is hidden in print). */
export function PrintButton({ label = "چاپ / PDF" }: { label?: string }) {
  return (
    <Button type="button" variant="ghost" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
