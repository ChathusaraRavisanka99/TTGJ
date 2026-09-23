import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { prismaMock } from "@/test/prisma-mock";
import { changePassword } from "@/actions/account";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const mockedAuth = auth as unknown as { mockResolvedValue: (v: { user: { id: string } } | null) => void };

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("changePassword", () => {
  beforeEach(() => {
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a signed-in session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await changePassword(formData({ currentPassword: "old-password", newPassword: "new-password-123" }));

    expect(result).toEqual({ ok: false, error: "Sign in required." });
  });

  it("refuses a new password shorter than 8 characters", async () => {
    const result = await changePassword(formData({ currentPassword: "old-password", newPassword: "short" }));

    expect(result.ok).toBe(false);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("refuses an account with no password to change (Google-only sign-in)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: null } as never);

    const result = await changePassword(formData({ currentPassword: "old-password", newPassword: "new-password-123" }));

    expect(result).toEqual({ ok: false, error: "This account doesn't have a password to change." });
  });

  it("refuses an incorrect current password", async () => {
    const realHash = await bcrypt.hash("actual-current-password", 12);
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: realHash } as never);

    const result = await changePassword(formData({ currentPassword: "wrong-password", newPassword: "new-password-123" }));

    expect(result).toEqual({ ok: false, error: "Current password is incorrect." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updates the password and clears mustChangePassword on success", async () => {
    const realHash = await bcrypt.hash("actual-current-password", 12);
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: realHash } as never);
    prismaMock.user.update.mockResolvedValue({} as never);

    const result = await changePassword(formData({ currentPassword: "actual-current-password", newPassword: "new-password-123" }));

    expect(result).toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: expect.any(String), mustChangePassword: false },
    });
  });
});
