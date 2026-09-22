import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingChatButton } from "./FloatingChatButton";
import { pollMyConversations, pollChatMessages, getHasOpenCartForRequest } from "@/actions/chat";

vi.mock("@/actions/chat", () => ({
  pollMyConversations: vi.fn(),
  pollChatMessages: vi.fn().mockResolvedValue([]),
  getHasOpenCartForRequest: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/components/chat/ChatPanel", () => ({ ChatPanel: () => <div>chat panel</div> }));

const conversations = {
  items: [
    { requestType: "general" as const, requestId: "user-1", itemLabel: "Chat with Support", lastMessagePreview: null, lastMessageAt: null, unreadCount: 0 },
    { requestType: "quote" as const, requestId: "quote-1", itemLabel: "Ceylon Sapphire", lastMessagePreview: "Hi!", lastMessageAt: "2026-01-01T00:00:00Z", unreadCount: 3 },
  ],
  unreadCount: 3,
  userId: "user-1",
};

// Regression test: opening a conversation only marked it read on the
// server (via ChatPanel's own effect) - the bubble's badge and that
// conversation's own row badge were separate local state that never got
// told about it, so the unread number stayed on screen until the next
// 20s background poll happened to catch up. It should disappear the
// moment the conversation is opened.
describe("FloatingChatButton", () => {
  it("clears the bubble badge and the conversation's own badge as soon as it's opened", async () => {
    vi.mocked(pollMyConversations).mockResolvedValue(conversations);
    const user = userEvent.setup();
    render(<FloatingChatButton />);

    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());

    await user.click(screen.getByLabelText("Your conversations"));
    await waitFor(() => expect(screen.getByText("Ceylon Sapphire")).toBeInTheDocument());
    await user.click(screen.getByText("Ceylon Sapphire"));

    await waitFor(() => expect(screen.queryByText("3")).not.toBeInTheDocument());
    expect(pollChatMessages).toHaveBeenCalledWith("quote", "quote-1");
    expect(getHasOpenCartForRequest).toHaveBeenCalledWith("quote", "quote-1");
  });
});
