import { BackLink } from "@/components/admin/BackLink";
import { ManualSaleForm } from "@/components/admin/ManualSaleForm";

export default function NewManualSalePage() {
  return (
    <div>
      <BackLink href="/admin/orders" label="Back to Orders" />
      <h1 className="font-serif text-3xl text-charcoal">Record a Manual Sale</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        For a sale that happened outside the system — in person, or otherwise off-platform. Creates the order already
        paid and sells the selected items immediately.
      </p>
      <div className="mt-6">
        <ManualSaleForm />
      </div>
    </div>
  );
}
