"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markOrderShippedByAdmin } from "@/actions/orders";
import { useAdminAction } from "@/lib/hooks/useAdminAction";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function ShipOrderForm({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, error, run } = useAdminAction();

  function handleSubmit(formData: FormData) {
    run(
      () => markOrderShippedByAdmin(orderId, formData),
      () => {
        setOpen(false);
        router.refresh();
      },
    );
  }

  return (
    <>
      <Button type="button" size="sm" variant="gold" onClick={() => setOpen(true)}>Mark shipped</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Mark ${orderNumber} shipped`}>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Input id="carrier" name="carrier" required placeholder="E.g. DHL Express" />
          </div>
          <div>
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input id="trackingNumber" name="trackingNumber" required />
          </div>
          <div>
            <Label htmlFor="trackingUrl">Tracking URL (optional)</Label>
            <Input id="trackingUrl" name="trackingUrl" type="url" placeholder="https://..." />
          </div>
          <FieldError>{error ?? undefined}</FieldError>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? "Saving..." : "Mark Shipped"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
