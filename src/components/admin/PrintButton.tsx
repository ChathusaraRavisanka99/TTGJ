"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** print:hidden so it vanishes from the actual printed/PDF output — it has
 * no reason to exist on paper, only on screen as the trigger. */
export function PrintButton() {
  return (
    <Button type="button" variant="gold" className="print:hidden" onClick={() => window.print()}>
      <Printer size={16} /> Print / Save as PDF
    </Button>
  );
}
