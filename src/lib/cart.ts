import { prisma } from "@/lib/prisma";
import type { ConfiguredSpec } from "@/lib/validation/quote";

// A customer has at most one OPEN cart at a time — enforced here (not by a
// DB constraint; see the schema comment above the Cart model) by always
// looking for an existing OPEN one before creating a new one. Accepting a
// quote or sourcing request adds a line item to whatever this returns,
// auto-creating a cart on first use so a customer never has to do
// anything to "start" one.
export async function getOrCreateOpenCart(userId: string) {
  const existing = await prisma.cart.findFirst({ where: { userId, status: "OPEN" } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

function quoteItemLabel(quote: {
  gemstone: { name: string } | null;
  jewelry: { name: string } | null;
  configuredSpec: unknown;
}): string {
  if (quote.gemstone) return quote.gemstone.name;
  if (quote.jewelry) return quote.jewelry.name;
  const spec = quote.configuredSpec as ConfiguredSpec | null;
  return spec ? `Configured ${spec.mineralName} (${spec.cutName})` : "Configured gemstone";
}

/**
 * Called whenever a quote's status moves to ACCEPTED (see
 * updateQuoteRequest). Idempotent — if a cart item already exists for this
 * quote, it's left untouched. No-ops if the quote has no price set; the
 * caller validates that before allowing an ACCEPTED transition.
 */
export async function ensureCartItemForQuote(quoteId: string): Promise<void> {
  const existing = await prisma.cartItem.findUnique({ where: { quoteRequestId: quoteId } });
  if (existing) return;

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { gemstone: true, jewelry: true },
  });
  if (!quote || quote.quotedPrice == null) return;

  const cart = await getOrCreateOpenCart(quote.userId);
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      quoteRequestId: quote.id,
      label: quoteItemLabel(quote),
      amount: quote.quotedPrice,
    },
  });
}

/** Same idea as ensureCartItemForQuote, for sourcing requests. */
export async function ensureCartItemForSourcing(sourcingId: string): Promise<void> {
  const existing = await prisma.cartItem.findUnique({ where: { sourcingRequestId: sourcingId } });
  if (existing) return;

  const request = await prisma.sourcingRequest.findUnique({ where: { id: sourcingId } });
  if (!request || request.quotedPrice == null) return;

  const cart = await getOrCreateOpenCart(request.userId);
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      sourcingRequestId: request.id,
      label: `Sourcing: ${request.mineralDescription}`,
      amount: request.quotedPrice,
    },
  });
}
