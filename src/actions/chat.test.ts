import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { sendChatMessage } from "@/actions/chat";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/chat")>();
  return {
    ...actual,
    getChatContext: vi.fn(),
    getOrCreateChatThread: vi.fn(),
    snapshotOpenCart: vi.fn(),
  };
});

import { auth } from "@/lib/auth";
import { getChatContext, getOrCreateChatThread } from "@/lib/chat";

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue({ user: { id: "customer-1", role: "CUSTOMER" } } as never);
  vi.mocked(getChatContext).mockResolvedValue({ threadId: "thread-1", customerId: "customer-1" } as never);
  vi.mocked(getOrCreateChatThread).mockResolvedValue("thread-1");
  prismaMock.chatMessage.create.mockResolvedValue({} as never);
});

describe("sendChatMessage — video call request tag", () => {
  it("stamps isVideoCallRequest on the created message when tagged", async () => {
    const result = await sendChatMessage({ requestType: "quote", requestId: "quote-1", body: "", tag: { type: "videoCallRequest" } });
    expect(result).toEqual({ ok: true });
    expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isVideoCallRequest: true }),
    });
  });

  it("leaves isVideoCallRequest false for a plain text message", async () => {
    await sendChatMessage({ requestType: "quote", requestId: "quote-1", body: "Hello" });
    expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isVideoCallRequest: false }),
    });
  });

  it("allows sending the video-call tag with no body text, same as the cart tag", async () => {
    const result = await sendChatMessage({ requestType: "sourcing", requestId: "sourcing-1", body: "", tag: { type: "videoCallRequest" } });
    expect(result).toEqual({ ok: true });
  });
});
