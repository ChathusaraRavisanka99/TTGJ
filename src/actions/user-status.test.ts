import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { setUserDisabled } from "@/actions/user-status";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));

const future = () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

describe("setUserDisabled", () => {
  it("won't let an admin disable themselves", async () => {
    const result = await setUserDisabled("admin-1", { mode: "permanent" });
    expect(result).toEqual({ ok: false, error: "You can't disable your own account." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("won't disable another admin", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "ADMIN" } as never);
    const result = await setUserDisabled("admin-2", { mode: "permanent" });
    expect(result.ok).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("refuses an unknown user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect((await setUserDisabled("nope", { mode: "permanent" })).ok).toBe(false);
  });

  it("disables permanently with no end date", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "STAFF" } as never);
    prismaMock.user.update.mockResolvedValue({} as never);

    const result = await setUserDisabled("staff-1", { mode: "permanent", reason: "  left the company  " });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "staff-1" },
      data: { disabledAt: expect.any(Date), disabledUntil: null, disabledReason: "left the company" },
    });
  });

  it("disables temporarily until the chosen date", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "CUSTOMER" } as never);
    prismaMock.user.update.mockResolvedValue({} as never);
    const until = future();

    const result = await setUserDisabled("user-1", { mode: "temporary", until });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { disabledAt: expect.any(Date), disabledUntil: new Date(until), disabledReason: null },
    });
  });

  it("rejects a temporary disable whose end date is in the past or unreadable", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "CUSTOMER" } as never);
    expect((await setUserDisabled("user-1", { mode: "temporary", until: "2020-01-01T00:00:00Z" })).ok).toBe(false);
    expect((await setUserDisabled("user-1", { mode: "temporary", until: "not a date" })).ok).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("enables an account by clearing every disabled field", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "STAFF" } as never);
    prismaMock.user.update.mockResolvedValue({} as never);

    const result = await setUserDisabled("staff-1", { mode: "enable" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: "staff-1" }, data: { disabledAt: null, disabledUntil: null, disabledReason: null } });
  });
});
