import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import { prismaMock } from "@/test/prisma-mock";
import { createPasswordResetToken, verifyPasswordResetToken, consumePasswordResetToken } from "@/lib/password-reset";

function hash(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

describe("createPasswordResetToken", () => {
  it("invalidates any still-live tokens for the user before creating a new one", async () => {
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.passwordResetToken.create.mockResolvedValue({} as never);

    const { rawToken, expiresAt } = await createPasswordResetToken("user-1");

    expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/); // 32 bytes, hex-encoded
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("stores only the hash of the token, never the raw value", async () => {
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.passwordResetToken.create.mockResolvedValue({} as never);

    const { rawToken } = await createPasswordResetToken("user-1");

    const createCall = prismaMock.passwordResetToken.create.mock.calls[0][0] as { data: { tokenHash: string } };
    expect(createCall.data.tokenHash).toBe(hash(rawToken));
    expect(createCall.data.tokenHash).not.toBe(rawToken);
  });
});

describe("verifyPasswordResetToken", () => {
  it("accepts a valid, unexpired, unused token", async () => {
    const rawToken = "a".repeat(64);
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "token-1", userId: "user-1", tokenHash: hash(rawToken), usedAt: null, expiresAt: new Date(Date.now() + 60000),
    } as never);

    const result = await verifyPasswordResetToken(rawToken);

    expect(result).toEqual({ id: "token-1", userId: "user-1" });
  });

  it("rejects a token that doesn't exist", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
    expect(await verifyPasswordResetToken("nonexistent")).toBeNull();
  });

  it("rejects an already-used token", async () => {
    const rawToken = "b".repeat(64);
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "token-1", userId: "user-1", tokenHash: hash(rawToken), usedAt: new Date(), expiresAt: new Date(Date.now() + 60000),
    } as never);
    expect(await verifyPasswordResetToken(rawToken)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const rawToken = "c".repeat(64);
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "token-1", userId: "user-1", tokenHash: hash(rawToken), usedAt: null, expiresAt: new Date(Date.now() - 1000),
    } as never);
    expect(await verifyPasswordResetToken(rawToken)).toBeNull();
  });
});

describe("consumePasswordResetToken", () => {
  it("claims the token and updates the password when the token is still unused", async () => {
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.update.mockResolvedValue({} as never);

    const result = await consumePasswordResetToken("token-1", "user-1", "new-hash");

    expect(result).toBe(true);
    expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith({ where: { id: "token-1", usedAt: null }, data: { usedAt: expect.any(Date) } });
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { passwordHash: "new-hash" } });
  });

  it("does not touch the password when the token was already claimed (a concurrent double-submit)", async () => {
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    const result = await consumePasswordResetToken("token-1", "user-1", "new-hash");

    expect(result).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
