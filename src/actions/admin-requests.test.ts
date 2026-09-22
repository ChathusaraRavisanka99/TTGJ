import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { updateQuoteRequest } from "@/actions/admin-requests";
import { requireAdmin } from "@/lib/rbac";
import { ensureInvoiceForQuote } from "@/lib/invoicing";
import { ensureOrderForQuote } from "@/lib/orders";
import { createNotification } from "@/lib/notifications";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/invoicing", () => ({ ensureInvoiceForQuote: vi.fn() }));
vi.mock("@/lib/orders", () => ({ ensureOrderForQuote: vi.fn(), ensureOrderForSourcing: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

const currentQuote = { quotedPrice: 5000, status: "QUOTED", userId: "user-1" };

describe("updateQuoteRequest accepting a quote", () => {
  beforeEach(() => {
    vi.mocked(requireAdmin).mockResolvedValue({ id: "admin-1", role: "ADMIN" } as never);
    prismaMock.quoteRequest.findUnique.mockResolvedValue(currentQuote as never);
    prismaMock.quoteRequest.update.mockResolvedValue({} as never);
    vi.mocked(ensureInvoiceForQuote).mockResolvedValue(undefined as never);
    vi.mocked(createNotification).mockResolvedValue(undefined as never);
  });

  it("creates the order and notifies the customer on success", async () => {
    vi.mocked(ensureOrderForQuote).mockResolvedValue({ ok: true, orderId: "order-1" });

    const result = await updateQuoteRequest("quote-1", "ACCEPTED", "", 5000);

    expect(result).toEqual({ ok: true });
    expect(ensureOrderForQuote).toHaveBeenCalledWith("quote-1", "admin-1");
    // Two status updates would mean the rollback path also ran — it shouldn't have.
    expect(prismaMock.quoteRequest.update).toHaveBeenCalledTimes(1);
  });

  it("rolls the status back to what it was and surfaces the error when the order can't be created", async () => {
    vi.mocked(ensureOrderForQuote).mockResolvedValue({ ok: false, error: "That item is no longer available to sell." });

    const result = await updateQuoteRequest("quote-1", "ACCEPTED", "", 5000);

    expect(result).toEqual({ ok: false, error: "That item is no longer available to sell." });
    // First call sets ACCEPTED, second call reverts to the prior status.
    expect(prismaMock.quoteRequest.update).toHaveBeenNthCalledWith(2, { where: { id: "quote-1" }, data: { status: "QUOTED" } });
    // A failed accept never notifies the customer about a status change.
    expect(createNotification).not.toHaveBeenCalled();
  });
});
