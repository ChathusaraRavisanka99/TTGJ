import { getShippingZones } from "@/lib/shipping";
import { ShippingZoneRow } from "@/components/admin/ShippingZoneRow";
import { CreateShippingZoneForm } from "@/components/admin/CreateShippingZoneForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminShippingZonesPage() {
  const zones = await getShippingZones();

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Shipping Zones</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Flat EMS rate per order by destination — there&apos;s no public EMS rate API, so these are seeded with
        placeholder figures. Update them with your real rate card. Exactly one zone should be the fallback, matched
        when a shipping country isn&apos;t listed anywhere else.
      </p>

      <div className="mt-6">
        <CreateShippingZoneForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Countries</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => <ShippingZoneRow key={z.id} zone={z} />)}
            {zones.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No shipping zones yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
