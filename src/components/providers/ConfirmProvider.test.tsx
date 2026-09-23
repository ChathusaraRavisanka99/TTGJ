import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider, useConfirm } from "./ConfirmProvider";

function Trigger({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () => {
        const result = await confirm("Delete this item?", { confirmLabel: "Delete", danger: true });
        onResult(result);
      }}
    >
      Delete
    </button>
  );
}

describe("ConfirmProvider", () => {
  it("resolves true when Confirm is clicked, and shows the custom message/label", async () => {
    const user = userEvent.setup();
    let result: boolean | undefined;
    render(
      <ConfirmProvider>
        <Trigger onResult={(v) => (result = v)} />
      </ConfirmProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete this item?")).toBeInTheDocument();

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    expect(result).toBe(true);
  });

  it("resolves false when Cancel is clicked, and the dialog closes", async () => {
    const user = userEvent.setup();
    let result: boolean | undefined;
    render(
      <ConfirmProvider>
        <Trigger onResult={(v) => (result = v)} />
      </ConfirmProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(result).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resolves false when dismissed without a button (Escape/backdrop)", async () => {
    const user = userEvent.setup();
    let result: boolean | undefined;
    render(
      <ConfirmProvider>
        <Trigger onResult={(v) => (result = v)} />
      </ConfirmProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.keyboard("{Escape}");

    expect(result).toBe(false);
  });

  it("throws a clear error when useConfirm is used outside the provider", () => {
    function Bare() {
      useConfirm();
      return null;
    }
    expect(() => render(<Bare />)).toThrow("useConfirm must be used inside ConfirmProvider");
  });
});
