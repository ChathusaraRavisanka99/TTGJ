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

- ~~**Manual/offline sale registration**~~ — done. New `/admin/orders/manual/new`
  (`ManualSaleForm.tsx`): admin looks up an existing customer by email,
  searches AVAILABLE gems/jewelry (variant-aware) to add as line items
  with an editable, negotiated price, and records payment as Cash or Bank
  Transfer — the latter requiring both a payment reference and a receipt
  file (reuses `saveCertificateFile` for the upload). New `PaymentMethod.CASH`
  enum value and `Order.manualSale`/`manualPaymentReference`/
  `manualReceiptUrl` fields. `lib/orders.ts`'s `createManualSaleOrder`
  resolves each line against the real catalog record server-side (never
  trusts a client-supplied label/availability), reserves items with the
  same conditional AVAILABLE→RESERVED race guard checkout uses, then runs
  the order through the exact same `finalizePaidOrder` pipeline every
  other payment path does — so a manual sale earns rewards points, sends
  the customer a notification + confirmation email, and sells the item,
  for free. Shows a "Manual Sale" badge on the admin orders list/detail
  page. 19 new tests; live-verified end-to-end via Playwright for both
  payment paths (cash sale with a negotiated price below catalog list,
  and a bank-transfer sale with an uploaded receipt) against the real DB
  — confirmed the item sold, points were earned, and the reference/
  receipt show on the order page. Found and fixed a minor gap along the
  way: the smoke test's own uploaded test receipts were leftover blobs in
  Supabase Storage after the order rows were deleted (deleting an Order
  doesn't delete its `manualReceiptUrl` file) — cleaned up manually for
  this test run; not fixed in the app itself since a real receipt should
  outlive its order for record-keeping, this is only a test-cleanup
  footgun, not a product bug.
- ~~**Admin-assisted order creation from sourcing**~~ — done. Confirmed
  three scoping questions with you before building: the customer only
  ever reaches a private item through their own `/account/orders/[id]`
  page (never a raw product-page URL, so no new "private but
  direct-link-reachable" visibility mode was needed — `isPublished: false`
  already 404s a direct visit, unchanged); the on-the-fly item's "quick
  form" is genuinely minimal for jewelry (name + description + piece/metal
  type) but for a gemstone still needs its real taxonomy (mineral, cut,
  clarity, treatment, origin, carat) since those columns are NOT NULL and
  describe what the stone actually is — skips only the optional fields the
  full form has (dimensions, symmetry/polish, certification, shipping);
  and one order can hold multiple items. New `/admin/sourcing/[id]/build-order`
  (`SourcingOrderBuilder.tsx`, reuses `searchAvailableCatalogItems` from
  the manual-sale feature): admin searches existing catalog items and/or
  quick-creates new private ones, each with its own agreed price, then
  sends it — `lib/orders.ts`'s `createOrderFromSourcing` resolves every
  line server-side, reserves items with the same conditional race guard
  every other order-creation path uses, marks the request ACCEPTED, and
  reuses the existing `notifyAndMessageForNewOrder` notification + chat
  message. Sits alongside (doesn't replace) the existing single-price
  `ensureOrderForSourcing` path, still used when there's no specific
  catalog item to attach. A gemstone's `colorHue` is auto-derived from the
  chosen mineral's own hue range, so the admin never has to fiddle with a
  color picker for a quick add. 14 new tests; live-verified end-to-end via
  Playwright (added one existing published item and one brand-new private
  gemstone to the same order, confirmed both reserved, the request
  ACCEPTED, the customer notified, the private item unreachable at its own
  product-page URL but visible by name on the customer's own order page).
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

- ~~**Full CRUD on an auction item**~~ — investigated: already fully
  built. The admin list links every row to `/admin/auctions/[id]`, which
  has view (specs, bid history), edit (`AuctionForm`, price/dates/status —
  the item itself is intentionally immutable after creation, cancel and
  recreate instead), delete (draft-with-no-bids only), cancel, and confirm
  winner (`AuctionAdminControls`). Nothing left to build here — this entry
  was stale.
- ~~**Win → unpaid order**~~ — done. Confirming a winner now creates a
  real unpaid `Order` (`ensureOrderForAuctionWin` in `lib/orders.ts`, same
  pattern as `ensureOrderForQuote`/`ensureOrderForSourcing`) instead of
  the old `ensureCartItemForAuction`/`Cart` path, which is now fully dead
  and removed. `Auction.wonAt` stamps the moment of confirmation; a new
  hourly Vercel Cron job (`vercel.json` → `/api/cron/auction-payment-deadline`,
  bearer-token authenticated via `CRON_SECRET`) calls
  `expireUnpaidAuctionWins`, which cancels the still-unpaid order (releasing
  the item back to `AVAILABLE`, same as any cancelled wire-transfer order)
  and marks the auction `EXPIRED` (a new status, distinct from admin-driven
  `CANCELLED`) once 24 hours pass. 19 new tests; live-verified end-to-end
  — confirmed a winner through the real admin UI, verified the order/
  reservation/notification, then simulated the deadline passing and
  confirmed the cron logic correctly cancelled the order and released the
  item back to stock.
- ~~**Countdown for a scheduled auction**~~ — done. `AuctionCountdown.tsx`
  on the public auction detail page — ticks every second (days/hours/
  minutes/seconds, animated digit transitions via `motion/react`) once an
  auction's `startsAt` is in the future, and refreshes the page itself once
  it hits zero so bidding opens without a manual reload. Live-verified via
  Playwright against a real scheduled auction.

## Rewards / points

*Depends on: per-item `costPrice` and sold-only profit analytics — already
shipped (`lib/analytics.ts`, `computeProfit`).*

- ~~**Separate points currencies**~~ — done. Confirmed with you first:
  one shared `User.pointsBalance` (not a separate per-market ledger) —
  just earned/redeemed at a different, independent rate depending on
  which store the order is on. New `LoyaltySettings.pointsPerCurrencyUnitLkr`/
  `pointsRedemptionValueLkr`, applied directly to the LKR amount instead of
  (as before) converting through `CommerceSettings.usdToLkrRate` — a
  customer's rupee point value no longer silently drifts whenever that
  exchange rate changes. Default rates (0.01 pts/Rs 1 earned, 1 pt = Rs 1
  redeemed) keep the same ~1% earn-and-redeem economics as the
  international side, just expressed natively — my own judgment call
  since the TODO only specified the redemption side explicitly.
  `minRedeemPoints`/`maxRedeemPercentOfOrder` stay shared across both
  stores (not called out for separation, and each is already a
  meaningful floor/cap within its own currency thanks to the rate
  design). Admin loyalty-settings page split into International/Sri
  Lanka sections. New/updated tests; live-verified via Playwright
  against a real LK checkout with points staged.
- ~~**Post-purchase reward game**~~ — done. Once an order reaches PAID
  (any payment path — card, wire confirmation, manual sale — all funnel
  through `finalizePaidOrder`), `notifyGemDigAvailable` (`lib/gem-dig.ts`)
  sends an in-app notification if the order actually has real profit to
  draw a bonus from (`isGemDigEligible` — skipped silently for a $0/
  uncosted-profit order, never offering a hollow dig). The notification
  points at the order's own page (not a dedicated link — `NotificationBell`
  hardcodes its link target per request type, and the order page is now
  also the CTA entry point) via a new banner + "Dig for a gem" link, shown
  only while the reward is still unclaimed. `/account/orders/[id]/dig`
  shows the possible range (1%-5% of the order's profit, same
  `unitPrice − costPrice` basis as `computeProfit`/the birthday discount,
  converted to points at the order's own currency's native rate) with a
  "Good luck" button and a punchline; `DigForGemAnimation.tsx` swings a
  pickaxe then reveals a gem with the awarded points and a note that
  Ratnavue can change or remove the reward program at any time. One-time
  only — `playGemDig` claims it via a conditional `updateMany`
  (`gemDigPlayedAt: null → now`) inside the same transaction as the
  `PointsTransaction` (`reason: GEM_DIG_BONUS`) it records, so a
  double-click or a race against itself can't award twice; revisiting
  `/dig` afterward shows the persisted result instead of replaying.
  New migration (`Order.gemDigPlayedAt`/`gemDigPointsAwarded`,
  `PointsTransactionReason.GEM_DIG_BONUS`). 20 new tests
  (`lib/gem-dig.test.ts`, `actions/gem-dig.test.ts`). Live-verified via
  Playwright against a real PAID order with a known $100 profit margin:
  CTA banner appeared, range showed correctly (1-5 points), digging
  awarded 4 points (within range), `PointsTransaction`/`pointsBalance`
  updated correctly in the DB, reloading `/dig` showed the persisted
  result without re-awarding, and the CTA banner correctly disappeared
  from the order page afterward.
- ~~**Admin approval gate**~~ — done. Confirmed with you first: the order
  still completes normally (payment, stock, points all settle exactly as
  before) — a new `Order.needsPointsApproval` flag is just a paper-trail
  review flag, same "flag, don't block" pattern as the existing Shipping
  TBD one, not a checkout gate. `lib/checkout.ts`'s `buildCheckoutBreakdown`
  sums each item's actual profit (retailPrice − costPrice, same basis the
  birthday discount already uses) and sets the flag when the points
  discount exceeds it; an item with no recorded costPrice counts as $0
  profit (a deliberately conservative default — more likely to flag for
  review, not less). Shows as a "Needs Points Approval" badge on the
  admin orders list/detail page with an "Approve points redemption"
  button to clear it (`ClearPointsApprovalButton.tsx`, mirrors the
  Shipping TBD button exactly). New tests; live-verified end-to-end via
  Playwright (a Rs 50,000 points redemption against a Rs 20,000-profit
  item correctly flagged the order, and the admin button correctly
  cleared it).
- ~~**Customer point history on admin order/customer views**~~ — done.
  `/admin/customers/[id]` gained an Orders list (order number, date, total,
  status, and points used on it when any) alongside the rewards-points
  panel that was already there. `/admin/orders/[id]` gained a Customer
  panel (name/email, current points balance, a link to their customer
  page) plus a "Points used" row in the order's own Total breakdown when
  applicable. Pure display, no schema/actions needed — live-verified via
  Playwright against a seeded order.

## Storefront UX

- ~~**Search overlay with live suggestions**~~ — done. Clicking search now
  opens a `Modal` overlay with debounced (300ms) live suggestions
  (`lib/search-suggestions.ts` — a fast, minimal-select query, separate
  from the full `/search` page's own heavier one), thumbnail + name +
  price per result, a "no matches" state, and "View all results" still
  going to `/search?q=...`.
- ~~**T&Cs checkbox**~~ — done. A required, unchecked-by-default checkbox
  (submit stays disabled until checked, plus the usual server-side refusal
  too) at signup (`RegisterForm.tsx`) and again on the checkout form
  (`CheckoutForm.tsx`), both linking to a new static `/terms` page. Stamps
  an audit timestamp either way — `User.termsAcceptedAt` at signup,
  `Order.termsAcceptedAt` at checkout (a returning customer re-agrees on
  every order, not just once at signup) — both nullable, so an account/
  order created another way (admin-registered wholesale, quote/sourcing/
  auction-win/manual-sale orders, which never show a checkout form) simply
  has no stamp rather than a fabricated one. An account created via Google
  sign-in also has no signup-time stamp, but still can't complete a
  purchase without agreeing at checkout — that's an acceptable, deliberate
  gap, not a hole (no purchase is possible without ever agreeing). New
  tests for both gates.
- ~~**Refunds/returns system**~~ — done. New `RefundRequest` model
  (`lib/refunds.ts`/`actions/refunds.ts`) — a customer starts one from
  their own order page (`/account/orders/[id]`) once it's PAID/SHIPPED/
  DELIVERED, picking a reason; the conversation happens in that order's
  own existing chat thread (reused as designed, no new thread type
  needed). An admin finalizes it from the order's admin page as Full,
  Minus Shipping, or Partial (admin enters the amount), with their own
  explicit choice of whether to release the item(s) back to `AVAILABLE`
  — restocking is never automatic, since a damaged/non-returnable item
  might be refunded without going back on sale. 27 new tests; live-
  verified end-to-end via Playwright (customer requested a refund on a
  seeded paid order, admin approved a full refund with restock checked,
  confirmed the item released back to stock, the refund amount, and the
  customer's own notification/page update). Found and fixed a real bug
  along the way during that live pass: the admin resolve form's "restock"
  checkbox (a checkbox + hidden-false-fallback pair, the same convention
  used all over this app's admin forms) was read with `formData.get()`,
  which returns the *first* of the two same-named fields — the hidden
  "false" — instead of `Object.fromEntries(formData.entries())`, which
  correctly keeps the checkbox's later "true" when checked. The checkbox
  silently never took effect; a unit test alone wouldn't have caught it
  since a hand-built test FormData doesn't reproduce a real browser's
  duplicate-name submission. Fixed, and a regression test now
  specifically reproduces the duplicate-field submission.

## Growth & trust (competitor research, 2026-09-24)

*Sourced from a competitor pass over James Allen/Blue Nile, Angara,
Brilliant Earth, direct Ceylon-gemstone sellers (Wijaya Gems, GemSelect,
Ceylon Gem Hub), and jewelry-ecommerce UX benchmarks (Baymard, Branvas).
Ordered roughly by impact/effort, not dependency — each is independent
unless noted.*

- ~~**Product reviews (verified purchasers only)**~~ — done. Confirmed
  scope with you first: eligible from `PAID` onward (not `DELIVERED` —
  matches every other post-purchase feature already in this app, and
  doesn't depend on delivery status being tracked consistently), v1 is
  rating + text on product pages only (no photos, no catalog-card rating
  badges — flagged as a larger follow-up if wanted later). New `Review`
  model — never trusted from wherever the prompt was shown: `submitReview`
  re-verifies live that the reviewer has a `PAID`/`SHIPPED`/`DELIVERED`
  order containing that exact item, the same "hard recheck at the point
  of action" discipline `resolvePointsRedemption` already follows. Starts
  `PENDING`; only ever shown once an admin approves it from the new
  `/admin/reviews` moderation queue. A "Leave a Review" prompt appears
  inline on the order detail page for each purchased, not-yet-reviewed
  item, triggered by a new in-app notification hooked into
  `finalizePaidOrder` alongside the existing gem-dig/payment
  notifications (no email — Phase 3's transactional email isn't built
  yet). A gem/jewelry product page shows a "★★★★☆ 4.2 (8 reviews)"
  summary near the title plus the full written reviews further down,
  both omitted entirely when there's nothing approved yet rather than
  showing a hollow "0 reviews" line. 21 new tests
  (`lib/reviews.test.ts`, `actions/reviews.test.ts`); live-verified
  end-to-end via Playwright against a real seeded `PAID` order — left a
  5-star review, confirmed the "awaiting approval" message, confirmed it
  showed `PENDING` in the admin queue, approved it, then confirmed both
  the rating summary and the written review appeared correctly on the
  real product page.
- ~~**Wishlist / favorites**~~ — done. New `WishlistItem` model (exclusive
  gemstone/jewelry FK pair, same convention as `OrderItem` — not a DB
  uniqueness constraint, since a toggle button has no financial stakes if
  a rare double-click race ever left a duplicate row). A heart button
  (`WishlistButton.tsx`) now appears on every `GemCard`/`JewelryCard` —
  bottom-left of the thumbnail, deliberately not bottom-right, since the
  stock badge already moves there on mobile — and beside the title on
  both product detail pages. Signed-out visitors see the same heart
  routing to login instead of a hidden control, matching how Add to Cart
  already handles guests. Every catalog page (`/gems`, `/jewelry`,
  `/search`, home, both detail pages' related-items sliders) fetches the
  viewer's full saved-id set in one extra cheap indexed query
  (`getWishlistedIds`) so hearts show their real state everywhere, not
  just on the wishlist page itself. New `/account/wishlist` page lists
  everything saved, filtering out anything since unpublished or moved to
  the other store rather than showing it broken. 8 new tests
  (`lib/wishlist.test.ts`, `actions/wishlist.test.ts`); live-verified end-
  to-end via Playwright — saved a real gemstone from its product page,
  confirmed it persisted across reload, appeared on the wishlist page and
  as a filled heart back on the `/gems` grid, then removed it from the
  wishlist page and confirmed the card disappeared live (via
  `router.refresh()`) without a manual reload.
- ~~**360°-style product video + zoom**~~ — done. `MediaGallery.tsx`'s main
  photo now tracks the cursor and scales to 2.2x on hover (desktop) — a
  buyer can check color/inclusions against the listing the way James
  Allen's 40x diamond inspection lets theirs — plus a "Click to zoom" cue
  that opens a full-screen lightbox (close via the X, backdrop click, or
  Escape) for a closer look on any device, video already has its own
  native playback controls so only stills get the zoom affordance.
  Applies to both the gem and jewelry detail pages, which already share
  this one component. Admin media upload now also carries a hint to shoot
  a slow, steady rotation clip rather than an arbitrary one, since that's
  the format this actually reassures buyers with. No new upload infra —
  pure front-end addition on top of the existing `MediaAsset`/
  `MediaType.VIDEO` pipeline. Live-verified via Playwright against a real
  published gem's photo: confirmed the hover scale transform applies,
  the lightbox opens on click, and closes both via its own button and
  the Escape key.
- ~~**"One of one" scarcity messaging"**~~ — investigated: already fully
  built. Both `gems/[slug]/page.tsx` and `jewelry/[slug]/page.tsx` already
  show a "the only one" note (Sparkles icon, `t("onlyOne")`/
  `t("onlyOneJewelry")`) whenever `stockStatus === "AVAILABLE"` — the
  jewelry page correctly limits it to pieces with no variants (a piece
  with several variants can have more than one unit available at once, so
  the claim wouldn't be true there). Nothing left to build here — this
  entry was stale before it was even written.
- ~~**Origin/provenance content blocks**~~ — done. New `lib/origin-content.ts`,
  same `PageContent` row-per-key convention `subculture-content.ts` already
  established (`origin:<id>` here instead of `collection:<key>`) — an
  origin with nothing written yet (blank headline) simply shows no block,
  same graceful-empty convention as the collection pages' optional
  images. Admin edits it from a new `/admin/master-data/origins/[id]`
  page (an "Edit content" link on each origins-list row), reusing the
  existing `saveUploadedMedia` single-image pattern. Shown as a full-width
  "About this origin" section on a gemstone's product page, between the
  main details and the related-items slider, whenever that gem's origin
  has a headline written. 11 new tests (`lib/origin-content.test.ts`,
  `actions/origin-content.test.ts`); live-verified end-to-end via
  Playwright against the real Ceylon origin row — confirmed no block
  shows before content exists, wrote a headline/body through the real
  admin form, confirmed it appeared correctly on a real published gem's
  product page, then cleared it and confirmed the block disappeared
  again.
- ~~**Ring/jewelry size guide**~~ — done. New static `/size-guide` page
  (ring US/UK/EU/circumference table, necklace length reference, bracelet
  measuring instructions — plain reference data, no admin editing needed,
  same static-page convention as `/terms`). Every jewelry product page now
  links to it as "Size Guide →", anchored to the right section for that
  piece's `pieceType` (`#rings`/`#necklaces`/`#bracelets`). Live-verified
  via Playwright: the link on a real published ring correctly points to
  `/size-guide#rings` and the page loads with that section visible.
- ~~**Free-shipping threshold**~~ — done. New `CommerceSettings.
  freeShippingThresholdUsd`/`freeShippingThresholdLkr` fields (opt-in,
  null/blank disables it, same currency-native convention as
  `LoyaltySettings`' LKR-specific rates) — `buildCheckoutBreakdown` waives
  the destination `ShippingZone` rate once the cart subtotal clears the
  threshold, but a weight-tiered item's own flat rate still applies
  regardless (that's a deliberate per-item exception, usually for
  something heavy/oversized, not something a store-wide promotion should
  override). The retail cart page shows a live "Add $X more to unlock
  free shipping" / "You've unlocked free shipping!" nudge computed from
  the real subtotal — a threshold that's invisible to the customer
  wouldn't do its job as a growth lever. Admin sets it per store on
  `/admin/commerce-settings`. 10 new tests; live-verified end-to-end via
  Playwright — set both thresholds through the real admin form, confirmed
  they persisted, then confirmed the customer-facing nudge correctly
  showed "Add $50 more" below the threshold and "You've unlocked free
  shipping!" once the cart cleared it.
- ~~**Bundle pricing on curated collections**~~ — done. Confirmed the
  mechanics with you first: a curated set + auto-applied discount, not a
  new single-line-item cart/order type. New `Bundle`/`BundleItem` models
  (admin picks 2+ existing gemstones/jewelry pieces + a combined price,
  `/admin/bundles`) — each item still checks out as its own ordinary
  `OrderItem`, so inventory reservation, profit tracking, and refunds are
  completely untouched; the discount is computed in
  `buildCheckoutBreakdown` purely from what's already in the cart, the
  same mechanism a discount code uses (an item claimed by one matching
  bundle can't double-count toward a second, overlapping one — first
  match by `sortOrder` wins). A "Complete the Look" panel now shows on a
  bundle member's own product page with the other piece(s), the
  individual-vs-bundled price, and an "Add All to Cart" button. New
  `Order.bundleDiscountAmount` snapshots it for the customer/admin order
  views. 24 new tests (`lib/checkout.test.ts`'s bundle-discount block,
  `lib/bundles.test.ts`, `actions/bundles.test.ts`,
  `actions/retail-cart.test.ts`'s `addBundleToCart` block); live-verified
  end-to-end via Playwright on the real Sri Lanka store — created a real
  bundle (Ceylon Sapphire Trilogy Ring + Moonstone Drop Earrings, Rs
  485,000 individually → Rs 420,000 bundled) through the actual admin UI,
  confirmed the "Complete the Look" panel and Add All to Cart on the
  ring's real product page, confirmed both items landed in the cart, and
  confirmed the checkout page showed the exact "Bundle discount −Rs
  65,000" line.
- ~~**"Book a live video call" CTA on quote/sourcing chats**~~ — done. New
  `ChatMessage.isVideoCallRequest` flag, same "tag" mechanism the chat
  system already uses for gemstone/jewelry/cart attachments (a new
  `videoCallRequest` `ChatTag` variant) — either side picks "Request a
  video call" from the existing attachment dropdown, same UX as tagging a
  cart, and the message renders with a distinct gold-bordered "Video call
  requested" callout instead of reading as a plain text message. No
  actual video-calling infrastructure built — the two sides still
  coordinate a time/link through the thread itself, matching the
  "lightweight" scope of this item. Available on quote/sourcing threads
  only (customer + admin detail pages, and the admin unified inbox) — not
  order/support threads, where inspecting a specific piece before buying
  doesn't apply. 3 new tests (`actions/chat.test.ts`); live-verified
  end-to-end via Playwright against a real quote request — customer
  requested a call, saw the correct callout on their own side, and the
  admin saw the identical callout on the quote's admin detail page.
- **BNPL at checkout** *(flagged, needs research before scoping)* — a
  named cart-abandonment fix in every benchmark (jewelry cart abandonment
  runs ~81%), but needs checking whether PayHere (the Sri Lanka gateway)
  or an alternative offers installment/BNPL for the international USD
  store — may not fit the LK market at all. Don't build until that's
  confirmed.
- **AR virtual try-on** *(flagged, bigger lift)* — a Brilliant-Earth-style
  photo-upload ring preview. Needs real image-compositing work or a
  third-party AR SDK, not a small feature — worth its own scoping pass
  before committing to it.
- **Diamond-style trade-up credit program** *(flagged, policy decision)* —
  trade an existing stone for credit toward a larger one (Blue Nile/James
  Allen's lifetime-upgrade model). More a financial/operational policy
  call than an engineering one — needs your decision before any schema
  work starts.

## Known, diagnosed, not yet fixed

- **Hero CTA buttons on the LK home page** — reported as hidden "in first
  look" (below the fold on some real viewports). Investigated but not
  fixed: I don't have enough information (the reporter's actual effective
  viewport height) to change the hero's sizing/spacing with confidence
  rather than guessing — the `sm:min-h-[720px]` hero comment already shows
  this exact tension was considered once for mobile; it may need the same
  treatment extended to short desktop windows.
