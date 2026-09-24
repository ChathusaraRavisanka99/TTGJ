import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { submitReviewAction, approveReview, rejectReview } from "@/actions/reviews";
import { submitReview } from "@/lib/reviews";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));
vi.mock("@/lib/reviews", () => ({ submitReview: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitReviewAction", () => {
  it("rejects when there's no signed-in session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await submitReviewAction({ gemstoneId: "gem-1" }, formData({ rating: "5" }));
    expect(result).toEqual({ ok: false, error: "Sign in required." });
    expect(submitReview).not.toHaveBeenCalled();
  });

  it("passes the parsed rating/body through to submitReview with the session's user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(submitReview).mockResolvedValue({ ok: true });
    const result = await submitReviewAction({ gemstoneId: "gem-1" }, formData({ rating: "4", body: "Great stone" }));
    expect(result).toEqual({ ok: true });
    expect(submitReview).toHaveBeenCalledWith({ userId: "user-1", gemstoneId: "gem-1", jewelryId: undefined, rating: 4, body: "Great stone" });
  });

  it("passes through a failure from submitReview unchanged", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(submitReview).mockResolvedValue({ ok: false, error: "You've already reviewed this item." });
    const result = await submitReviewAction({ gemstoneId: "gem-1" }, formData({ rating: "5" }));
    expect(result).toEqual({ ok: false, error: "You've already reviewed this item." });
  });
});

describe("approveReview", () => {
  it("sets the review's status to APPROVED", async () => {
    prismaMock.review.update.mockResolvedValue({ id: "review-1", gemstoneId: "gem-1", jewelryId: null } as never);
    const result = await approveReview("review-1");
    expect(result).toEqual({ ok: true });
    expect(prismaMock.review.update).toHaveBeenCalledWith({ where: { id: "review-1" }, data: { status: "APPROVED" } });
  });
});

describe("rejectReview", () => {
  it("sets the review's status to REJECTED with the admin's notes", async () => {
    prismaMock.review.update.mockResolvedValue({} as never);
    const result = await rejectReview("review-1", "Looks fabricated");
    expect(result).toEqual({ ok: true });
    expect(prismaMock.review.update).toHaveBeenCalledWith({ where: { id: "review-1" }, data: { status: "REJECTED", adminNotes: "Looks fabricated" } });
  });

  it("stores null for blank notes rather than an empty string", async () => {
    prismaMock.review.update.mockResolvedValue({} as never);
    await rejectReview("review-1", "   ");
    expect(prismaMock.review.update).toHaveBeenCalledWith({ where: { id: "review-1" }, data: { status: "REJECTED", adminNotes: null } });
  });
});
