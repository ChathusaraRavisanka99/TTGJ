import { describe, expect, it, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShipOrderForm } from "./ShipOrderForm";
import { markOrderShippedByAdmin } from "@/actions/orders";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/actions/orders", () => ({ markOrderShippedByAdmin: vi.fn() }));

// Regression test: markOrderShippedByAdmin used to be awaited with no
// try/catch, so a rejection (not a {ok:false} return — an actual thrown
// error, e.g. a network/DB timeout) left the submit button stuck on
// "Saving..." forever with nothing shown to the admin. See useAdminAction.
describe("ShipOrderForm", () => {
  it("recovers from the action throwing: button stops saving and an error appears", async () => {
    vi.mocked(markOrderShippedByAdmin).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();

    render(<ShipOrderForm orderId="order_1" orderNumber="RV-1001" />);
    await user.click(screen.getByRole("button", { name: "Mark shipped" }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Carrier"), "DHL Express");
    await user.type(within(dialog).getByLabelText("Tracking Number"), "1234567890");
    await user.click(within(dialog).getByRole("button", { name: "Mark Shipped" }));

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Mark Shipped" })).not.toBeDisabled());
    expect(within(dialog).getByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });
});
