import { prisma } from "@/lib/prisma";
import type { ConfiguredSpec } from "@/lib/validation/quote";
import { getQuoteGemVisual, type QuoteGemVisual } from "@/lib/quote-visual";

// Deep-enough include for cartItemVisual (below) to have everything it
// needs — the underlying product's photos/videos when it traces back to
// a catalog Gemstone or JewelryPiece, or enough of a configurator spec to
// fall back to the same procedural preview product pages use when
// there's no catalog photo yet. Shared between /account/cart and the
// admin cart detail page so the two can't drift out of sync with what
// cartItemVisual actually expects.
export const cartItemMediaInclude = {
  quoteRequest: {
    include: {
      gemstone: { include: { media: { orderBy: { sortOrder: "asc" as const } }, cut: true, mineral: true, clarityGrade: true } },
      jewelry: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
    },
  },
} as const;

export interface CartItemVisual {
  media: { id: string; url: string; type: string }[];
  gemVisual: QuoteGemVisual | null;
  href: string | null;
}

type CartItemWithMedia = {
  quoteRequest: {
    configuredSpec: unknown;
    gemstone: {
      slug: string;
      media: { id: string; url: string; type: string }[];
      cut: { slug: string; name: string };
      mineral: { name: string };
      clarityGrade: { slug: string; name: string };
      colorHue: number;
      colorLightness: number;
      colorSaturation: number;
      colorLabel: string | null;
      caratWeight: number;
    } | null;
    jewelry: { slug: string; media: { id: string; url: string; type: string }[] } | null;
  } | null;
};

/** Derives what CartItemThumbnail needs to render from a cart item fetched
 * with cartItemMediaInclude — a sourcing-originated item (no quoteRequest)
 * always resolves to "nothing to show," there's no product yet. */
export function cartItemVisual(item: CartItemWithMedia): CartItemVisual {
  const quote = item.quoteRequest;
  if (!quote) return { media: [], gemVisual: null, href: null };

  if (quote.gemstone && quote.gemstone.media.length > 0) {
    return { media: quote.gemstone.media, gemVisual: null, href: `/gems/${quote.gemstone.slug}` };
  }
  if (quote.jewelry && quote.jewelry.media.length > 0) {
    return { media: quote.jewelry.media, gemVisual: null, href: `/jewelry/${quote.jewelry.slug}` };
  }

  // Neither has photos yet (or this is a standalone configurator spec with
  // no catalog item at all) — fall back to the same procedural gem
  // preview product pages already use, still linking to the real catalog
  // page when one exists.
  const gemVisual = getQuoteGemVisual({ gemstone: quote.gemstone, configuredSpec: quote.configuredSpec });
  const href = quote.gemstone ? `/gems/${quote.gemstone.slug}` : quote.jewelry ? `/jewelry/${quote.jewelry.slug}` : null;
  return { media: [], gemVisual, href };
}

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
