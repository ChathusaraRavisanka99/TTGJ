import type { Metadata } from "next";
import { getPublicOrderStatus } from "@/actions/checkout";
import { ReturnStatus } from "@/components/checkout/ReturnStatus";

export const metadata: Metadata = { title: "Order Status" };

// Public — no session required (see the middleware comment on why) and
// nothing sensitive rendered here, ever: just a status. See ReturnStatus
// and getPublicOrderStatus for the full reasoning.
export default async function CheckoutReturnPage({ searchParams }: PageProps<"/checkout/return">) {
  const sp = await searchParams;
  const orderRecordId = typeof sp.order === "string" ? sp.order : "";
  const initial = orderRecordId ? await getPublicOrderStatus(orderRecordId) : null;

  return <ReturnStatus orderRecordId={orderRecordId} initial={initial} />;
}
