# Ratnavue — Open Work

Tracked items from product feedback that haven't been built yet. Each is
independent unless a dependency is noted. Standing discipline for all of
these: additive Prisma migration applied via `prisma migrate deploy`
against the shared prod DB before shipping dependent code, then
`tsc --noEmit` / `eslint src` / `npx vitest run` before commit.

## Catalog & inventory

- **Jewelry style/stock variants** — some jewelry pieces should offer
  multiple style/size variants, each with its own stock count; gems stay
  one-of-a-kind (qty 1, existing `stockStatus` enum) since that's already
  correct. Needs a `JewelryVariant` model, a variant picker on the product
  page, cart/checkout carrying the selected variant, and per-variant stock
  decrement at payment instead of the whole piece's `stockStatus`. Touches
  `RetailCartItem`, `OrderItem`, `lib/checkout.ts`, `actions/checkout.ts`,
  the admin jewelry form, and `lib/orders.ts`'s finalize/cancel logic.
  Largest single remaining item.
- ~~**Sold-item catalog visibility**~~ — investigated: a sold item was
  never actually buyable (the storefront only renders Add to Cart when
  `stockStatus === "AVAILABLE"`, and it already shows a "Sold" badge), so
  there was no double-sell risk — just no efficient way to unpublish a
  batch of them. Solved by the bulk-actions item below instead of a
  behavior change to what's shown.
- ~~**Admin bulk actions**~~ — done. Bulk select + Publish/Hide from
  storefront on both admin gems and jewelry lists
  (`CatalogBulkSelection.tsx`, `bulkSetCatalogPublished`).
- **Stale retail cart items** — if an item in a customer's cart gets
  bought by someone else (or removed) while it's still sitting in their
  cart, the row should show as disabled with a "remove" prompt rather than
  silently failing at checkout (checkout already re-validates availability
  server-side via `buildCheckoutBreakdown` — this is about surfacing it in
  the cart UI itself, before that point).
- **Shipping cost tiers** — admin-editable weight-based shipping cost
  bands (e.g. a "100g" tier), plus a per-item "quote shipping instead"
  fallback option.

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
- **Replace `window.confirm()` with a proper dialog** — used across ~10+
  admin action components (`OrderActions`, `MarkDeliveredButton`, several
  delete/toggle buttons). Needs a shared confirm-dialog component/hook and
  tests; not yet scoped file-by-file.
- **Retail vs. wholesale customer distinction** — surface `customerType`
  (already exists: `WHOLESALE`/wholesale-application flow is partially
  built) more clearly in the admin customer views. Plus: admin can
  register a wholesale user directly with a predefined password, and that
  user gets a notification + direct link prompting a password change.

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

- **Search overlay with live suggestions** — clicking the search icon
  should open a popup/overlay (not just navigate to `/search`), with
  type-ahead suggestions as the customer types, and a clear "no results"
  state.
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
