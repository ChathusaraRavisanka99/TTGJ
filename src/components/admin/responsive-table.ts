// Admin data tables that turn into stacked cards on phones and tablets (below
// the `lg` breakpoint) instead of forcing a sideways scroll to reach the
// status and action buttons. It's the same single <table> in the DOM — only
// its display changes — so nothing is rendered twice, and each cell shows its
// column name via a `data-label` attribute:
//
//   <table className={CARD_TABLE}>
//     <thead className={CARD_THEAD}>…</thead>
//     <tbody className={CARD_TBODY}>
//       <tr className={CARD_TR}>
//         <td data-label="Customer" className={CARD_TD}>…</td>
//         <td className={CARD_TD_ACTIONS}>…buttons…</td>
//
// Cells default to reading order 3; use CARD_FIRST / CARD_SECOND (order 1 / 2)
// for the card's heading cells and CARD_TD_ACTIONS (always last) for buttons.

export const CARD_TABLE = "w-full text-sm max-lg:block";
export const CARD_THEAD = "max-lg:hidden";
export const CARD_TBODY = "max-lg:block max-lg:divide-y max-lg:divide-border-subtle";
export const CARD_TR = "border-b border-border-subtle last:border-0 hover:bg-ivory-soft max-lg:flex max-lg:flex-col max-lg:gap-0.5 max-lg:border-b-0 max-lg:px-4 max-lg:py-4";

const CARD_CELL_BASE =
  "px-4 py-3 max-lg:flex max-lg:items-start max-lg:justify-between max-lg:gap-4 max-lg:px-0 max-lg:py-1 max-lg:text-right " +
  "max-lg:before:shrink-0 max-lg:before:text-left max-lg:before:text-xs max-lg:before:uppercase max-lg:before:tracking-wide max-lg:before:text-charcoal/65 max-lg:before:content-[attr(data-label)]";

export const CARD_TD = `${CARD_CELL_BASE} max-lg:order-3`;

/** The card's title cell (e.g. the order number): no label, left aligned. */
export const CARD_FIRST = "px-4 py-3 max-lg:order-1 max-lg:px-0 max-lg:py-0 max-lg:text-base";

/** A cell shown right under the title (e.g. status): labelled like the rest. */
export const CARD_SECOND = `${CARD_CELL_BASE} max-lg:order-2 max-lg:pb-2`;

/** The buttons: last, full width, set apart with a rule, no label. */
export const CARD_TD_ACTIONS = "px-4 py-3 max-lg:order-4 max-lg:mt-2 max-lg:border-t max-lg:border-border-subtle max-lg:px-0 max-lg:pb-0 max-lg:pt-3";
