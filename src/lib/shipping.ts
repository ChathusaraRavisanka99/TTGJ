import { prisma } from "@/lib/prisma";

// Lazily seeded on first read (same self-provisioning convention as
// lib/media.ts's storage bucket / lib/commerce-settings.ts's singleton)
// with clearly placeholder figures — confirmed with the business that
// real EMS rate-card numbers get filled in later via
// /admin/shipping-zones, since there's no public EMS rate API to pull
// them from automatically.
const DEFAULT_ZONES = [
  { label: "Sri Lanka (Domestic)", countries: ["Sri Lanka"], isFallback: false, ratePerOrderLKR: 500, sortOrder: 0 },
  { label: "South Asia", countries: ["India", "Pakistan", "Bangladesh", "Nepal", "Maldives", "Bhutan"], isFallback: false, ratePerOrderLKR: 4500, sortOrder: 1 },
  { label: "Rest of World", countries: [], isFallback: true, ratePerOrderLKR: 8500, sortOrder: 2 },
];

let seeded: Promise<void> | null = null;
function ensureDefaultShippingZones(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      const count = await prisma.shippingZone.count();
      if (count > 0) return;
      try {
        await prisma.shippingZone.createMany({ data: DEFAULT_ZONES });
      } catch {
        // Lost a race to a concurrent first request — zones exist now either way.
      }
    })();
  }
  return seeded;
}

export async function getShippingZones() {
  await ensureDefaultShippingZones();
  return prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getActiveShippingZones() {
  await ensureDefaultShippingZones();
  return prisma.shippingZone.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

// Matched by exact country name (case-insensitive) against a zone's
// country list; falls back to whichever zone is flagged isFallback (or,
// failing that, the first active zone) so an address from an unlisted
// country never blocks checkout outright.
export async function resolveShippingRate(country: string): Promise<{ zoneLabel: string; rateLKR: number }> {
  const zones = await getActiveShippingZones();
  const needle = country.trim().toLowerCase();
  const match = zones.find((z) => !z.isFallback && z.countries.some((c) => c.toLowerCase() === needle));
  const zone = match ?? zones.find((z) => z.isFallback) ?? zones[0];
  if (!zone) throw new Error("No shipping zones are configured yet.");
  return { zoneLabel: zone.label, rateLKR: zone.ratePerOrderLKR };
}
