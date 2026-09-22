import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminMessagesInbox, type InboxRow } from "./AdminMessagesInbox";
import { pollChatMessages, getHasOpenCartForRequest } from "@/actions/chat";

vi.mock("@/actions/chat", () => ({
  pollChatMessages: vi.fn().mockResolvedValue([]),
  getHasOpenCartForRequest: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/components/chat/ChatPanel", () => ({ ChatPanel: () => <div>chat panel</div> }));

const rows: InboxRow[] = [
  {
    requestType: "quote",
    requestId: "quote-1",
    itemLabel: "Ceylon Sapphire",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    status: "SUBMITTED",
    lastMessageAt: null,
    lastMessagePreview: "Hi!",
    unread: 2,
  },
];

// Regression test: the row's `unread` badge came from the initial
// server-rendered prop and never updated after selecting a row (opening a
// conversation marks it read on the server, via ChatPanel's own effect,
// but nothing told this list) - the badge sat there until a full page
// reload. It should clear the moment the row is opened.
describe("AdminMessagesInbox", () => {
  it("clears a row's unread badge when it's selected", async () => {
    const user = userEvent.setup();
    render(<AdminMessagesInbox rows={rows} currentAdminId="admin-1" />);

    const row = screen.getByText("Jane Doe").closest("tr")!;
    expect(within(row).getByText("2")).toBeInTheDocument();

    await user.click(row);

    await waitFor(() => expect(within(row).queryByText("2")).not.toBeInTheDocument());
    expect(pollChatMessages).toHaveBeenCalledWith("quote", "quote-1");
    expect(getHasOpenCartForRequest).toHaveBeenCalledWith("quote", "quote-1");
  });
});
