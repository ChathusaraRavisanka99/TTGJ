# Ratnavue — Open Work

Tracked items from product feedback that haven't been built yet. Each is
independent unless a dependency is noted. Standing discipline for all of
these: additive Prisma migration applied via `prisma migrate deploy`
against the shared prod DB before shipping dependent code, then
`tsc --noEmit` / `eslint src` / `npx vitest run` before commit.

## Catalog & inventory

- ~~**Jewelry style/stock variants**~~ — done. Opt-in per piece (a piece
  with none behaves exactly as before): new `JewelryVariant` model —
  free-text label (e.g. "Size 7"), its own `stockStatus`, and an optional
  price/cost override that falls back to the piece's own when unset.
  Confirmed this shape with you before building (label style, optional
  override, opt-in) via three quick questions. Admin manages variants from
  a piece's own edit page (`VariantManager.tsx`, mirrors
  `GemstoneLinkManager`); the product page shows a picker
  (`JewelryVariantPicker.tsx`) once any exist, requiring one be chosen
  before Add to Cart. `RetailCartItem`/`OrderItem` both carry the chosen
  variant; `lib/checkout.ts`'s money math and `lib/orders.ts`'s
  finalize/cancel logic sell/release the specific variant, not the whole
  piece. The piece's own `stockStatus` is kept as a derived "is anything
  under this piece still buyable" summary (`recomputeJewelryAvailability`
  in `lib/orders.ts`, called after every variant stock change) purely so
  every existing catalog/listing query that filters on it keeps working
  unchanged without learning about variants itself. 25 new tests; live-
  verified end-to-end via Playwright (admin creates two variants with a
  price override, customer picks one and checks out, only that variant
  reserves/sells while the other and the piece's own summary stay
  correct). Found and fixed an adjacent bug in the new variant schema
  along the way (blank cost/price field coercing to 0 instead of staying
  unset — the exact bug `optionalMoney` already exists to prevent
  elsewhere; same latent bug appears to affect the pre-existing
  gemstone/jewelry `costPrice`/`price`/`retailPrice` fields too, not
  fixed here — flagged, not in scope for this item).
- ~~**Sold-item catalog visibility**~~ — investigated: a sold item was
  never actually buyable (the storefront only renders Add to Cart when
  `stockStatus === "AVAILABLE"`, and it already shows a "Sold" badge), so
  there was no double-sell risk — just no efficient way to unpublish a
  batch of them. Solved by the bulk-actions item below instead of a
  behavior change to what's shown.
- ~~**Admin bulk actions**~~ — done. Bulk select + Publish/Hide from
  storefront on both admin gems and jewelry lists
  (`CatalogBulkSelection.tsx`, `bulkSetCatalogPublished`).
- ~~**Stale retail cart items**~~ — already built (found while working
  the list, not new work): `/account/retail-cart` re-checks live
  `stockStatus` on every page load and passes `unavailable` to
  `RetailCartItemRow`, which dims the row and swaps the price for an
  "Unavailable" label; Remove stays clickable either way. Checkout's own
  `buildCheckoutBreakdown` re-validates the same thing server-side.
- ~~**Shipping cost tiers**~~ — done. Admin-editable weight-based
  `ShippingWeightTier`s (`/admin/shipping-zones`, mirrors the existing
  zone CRUD) — assigning one to a gem/jewelry piece replaces the
  destination `ShippingZone` rate for that item (summed across tiered
  items in a cart; an untiered item in the same cart still falls under
  the one flat zone rate). A per-item "Quote Shipping" checkbox is the
  alternative: contributes $0 at checkout and sets a new
  `Order.shippingToBeArranged` flag, surfaced as a "Shipping TBD" badge
  on the admin orders list/detail page with a "Mark shipping arranged"
  button (admin follows up via the order's own chat thread, then clears
  it). Core money math is in `lib/checkout.ts`'s per-item loop, fully
  unit-tested; live-verified end-to-end via Playwright against the real
  DB (tier rate replacing the zone rate, quote-shipping's $0 + flag,
  the admin badge, and the clear button).

## Orders & admin workflow

- **Manual/offline sale registration** — admin creates an invoice for a
  sale that happened outside the system, marks payment as cash or bank
  transfer; for bank transfer, attach a receipt file and a payment
  reference number. Overlaps with the "register manual orders" ask.
- **Admin-assisted order creation from sourcing** — once a sourcing
  request's customer agrees, admin builds an order by adding items
  (including registering a brand-new catalog item on the fly, via a
  popup) and sends it to that customer as unpaid. Items added this way
  default to `isPublished: false` (hidden from normal browsing, but
  reachable/addable-to-cart via direct link) with an explicit "private
  sourcing item" notice and hidden price if someone stumbles onto the
  link — price only shows inside the order itself.
- ~~**Replace `window.confirm()` with a proper dialog**~~ — done. All 21
  call sites across 17 components converted to a shared, Promise-based
  `useConfirm()` (`ConfirmProvider.tsx`, mounted once in the root layout),
  matching the native function's call shape so each site only needed
  `await` added. Found and fixed a few adjacent bugs along the way
  (`JewelryForm`/`GemstoneForm`'s delete handlers didn't check the
  result before navigating away, silently hiding a real failure).
- ~~**Retail vs. wholesale customer distinction**~~ — done. Retail/
  Wholesale badge + filter on the admin customers list, and business
  name/reg no/status on the detail page. Admin can register a wholesale
  account directly with a predefined password
  (`CreateWholesaleAccountForm`, `createWholesaleAccount` — created
  already APPROVED, with its own `BusinessAccount`); the new customer
  gets a notification and email, and a new `mustChangePassword` flag
  shows a notice on a new `/account/change-password` page (also reachable
  from the account menu for anyone, not just a forced case).

## Auctions

- **Full CRUD on an auction item** — click through to view/edit/remove,
  not just create.
- **Win → unpaid order** — confirming an auction winner should create an
  unpaid order (same pattern as `ensureOrderForQuote`/
  `ensureOrderForSourcing` in `lib/orders.ts`) and notify the winner. New:
  a 24-hour payment deadline after which the item auto-releases back to
  stock — nothing like a deadline/expiry mechanism exists for any order
  today, so this needs a scheduled check (cron/route handler) as well as
  the order-creation logic. Currently, auction wins still go through the
  old `ensureCartItemForAuction`/`Cart` path (deliberately left alone when
  quotes/sourcing were migrated off it — see `lib/cart.ts`).
- **Countdown for a scheduled auction** — when an auction's start time is
  in the future, show an animated countdown on the auction page rather
  than nothing/a static state.

## Rewards / points

*Depends on: per-item `costPrice` and sold-only profit analytics — already
shipped (`lib/analytics.ts`, `computeProfit`).*

- **Separate points currencies** — international customers earn/redeem
  USD-rate points (100 pts = $1, matches existing
  `pointsRedemptionValue`); Sri Lanka customers earn/redeem LKR-rate local
  points (1 pt = Rs 1). Today there's one unified rate
  (`LoyaltySettings.pointsRedemptionValue`) — needs a second, LK-specific
  rate and probably a market-scoped points ledger rather than one balance.
- **Post-purchase reward game** — after a wire-transfer order is marked
  paid (or a card payment succeeds), the customer gets a one-time "dig for
  a gem" animation (a cute figure mining/digging, revealing a gem) instead
  of a spin wheel. Before digging, show the possible min/max point range
  and a "Good luck" button with a punchline. After digging, show the
  actual points awarded (1% or 5% of the order's profit, per
  `computeProfit`) and a note that Ratnavue can change or remove this
  reward program at any time. One-time only, delivered via an in-app
  message.
- **Admin approval gate** — if a customer's points redemption would cover
  more than the order's actual profit, admin must review and explicitly
  approve ("thumbs up") before the order can be processed.
- **Customer point history on admin order/customer views** — from an
  order or customer detail page, see that customer's past orders with
  amount paid and points used per order, plus their current point
  balance.

## Storefront UX

- ~~**Search overlay with live suggestions**~~ — done. Clicking search now
  opens a `Modal` overlay with debounced (300ms) live suggestions
  (`lib/search-suggestions.ts` — a fast, minimal-select query, separate
  from the full `/search` page's own heavier one), thumbnail + name +
  price per result, a "no matches" state, and "View all results" still
  going to `/search?q=...`.
- **T&Cs checkbox** — a required "I agree to the Terms & Conditions"
  checkbox at signup and again before placing an order. Terms should
  state that returns/refunds after a sale aren't guaranteed by default,
  but the site does have a process to handle them (see Refunds below).
- **Refunds/returns system** — customer can start a refund from "My
  Orders," picking from a set of reasons. Admin/support can have a
  conversation about it (reuse the chat-thread pattern already built for
  orders — see `lib/chat.ts`'s `"order"` request type) and finalize one
  of: full refund, refund minus shipping, or a partial refund. No schema,
  actions, or UI exist for this yet.

## Known, diagnosed, not yet fixed

- **Hero CTA buttons on the LK home page** — reported as hidden "in first
  look" (below the fold on some real viewports). Investigated but not
  fixed: I don't have enough information (the reporter's actual effective
  viewport height) to change the hero's sizing/spacing with confidence
  rather than guessing — the `sm:min-h-[720px]` hero comment already shows
  this exact tension was considered once for mobile; it may need the same
  treatment extended to short desktop windows.
