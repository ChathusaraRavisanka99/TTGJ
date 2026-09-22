import { describe, it, expect } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { captureBusinessInvite, BIZ_INVITE_COOKIE } from "@/lib/business";

describe("BIZ_INVITE_COOKIE", () => {
  it("is a stable cookie name shared by the invite route and both signup paths", () => {
    expect(BIZ_INVITE_COOKIE).toBe("biz_invite");
  });
});

describe("captureBusinessInvite", () => {
  it("attaches the new user to the team as a MEMBER when the invite is valid", async () => {
    prismaMock.businessAccount.findUnique.mockResolvedValue({ id: "biz-1" } as never);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await captureBusinessInvite("user-1", "biz-1");

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", businessAccountId: null },
      data: { businessAccountId: "biz-1", businessRole: "MEMBER" },
    });
  });

  it("does nothing for an invite token that doesn't match a real BusinessAccount", async () => {
    prismaMock.businessAccount.findUnique.mockResolvedValue(null);

    await captureBusinessInvite("user-1", "not-a-real-id");

    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("guards against reassigning a user who's already on a team (updateMany's own where, not a separate check)", async () => {
    prismaMock.businessAccount.findUnique.mockResolvedValue({ id: "biz-2" } as never);
    // A real DB would match 0 rows here because businessAccountId is
    // already set — the guard is the updateMany's WHERE clause itself,
    // asserted above, so this only confirms the call still completes
    // without throwing when nothing was actually updated.
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(captureBusinessInvite("already-on-a-team", "biz-2")).resolves.toBeUndefined();
  });
});
