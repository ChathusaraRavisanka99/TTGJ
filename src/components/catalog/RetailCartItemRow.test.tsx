import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { RetailCartItemRow } from "./RetailCartItemRow";
import { removeRetailCartItem } from "@/actions/retail-cart";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/actions/retail-cart", () => ({ removeRetailCartItem: vi.fn() }));
vi.mock("@/components/providers/MarketProvider", () => ({ useCurrency: () => "USD", useMarket: () => "intl" }));

const item = { id: "item-1", quantity: 1, unitPrice: 100, label: "Test Gem", href: "/gems/test", unavailable: false };

function renderRow() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ cart: { remove: "Remove", each: "{price} each", unavailable: "No longer available" } }}>
      <RetailCartItemRow item={item} />
    </NextIntlClientProvider>,
  );
}

// Regression test: removeRetailCartItem's {ok:false} result used to be
// completely ignored (no check at all), so a failed removal just silently
// did nothing - no error, the button simply stopped being disabled. That
// read as the row being "stuck," and gave no indication anything had gone
// wrong. It should now show the error and never leave the row in a dead
// in-between state.
describe("RetailCartItemRow", () => {
  it("shows an error and stops the loading state when removal is declined", async () => {
    vi.mocked(removeRetailCartItem).mockResolvedValue({ ok: false, error: "Item not found." });
    const user = userEvent.setup();
    renderRow();

    await user.click(screen.getByTitle("Remove"));

    await waitFor(() => expect(screen.getByText("Item not found.")).toBeInTheDocument());
    expect(screen.getByTitle("Remove")).not.toBeDisabled();
  });

  it("recovers with an error when the action throws instead of resolving", async () => {
    vi.mocked(removeRetailCartItem).mockRejectedValue(new Error("network hiccup"));
    const user = userEvent.setup();
    renderRow();

    await user.click(screen.getByTitle("Remove"));

    await waitFor(() => expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument());
    expect(screen.getByTitle("Remove")).not.toBeDisabled();
  });
});
