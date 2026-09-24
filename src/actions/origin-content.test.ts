import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { updateOriginContentText, setOriginContentImage } from "@/actions/origin-content";
import { saveOriginContent } from "@/lib/origin-content";
import { saveUploadedMedia } from "@/lib/media";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));
vi.mock("@/lib/origin-content", () => ({ saveOriginContent: vi.fn() }));
vi.mock("@/lib/media", () => ({ saveUploadedMedia: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  prismaMock.origin.findUniqueOrThrow.mockResolvedValue({ id: "origin-1", name: "Ratnapura" } as never);
});

describe("updateOriginContentText", () => {
  it("rejects a headline over the length limit", async () => {
    const result = await updateOriginContentText("origin-1", formData({ headline: "x".repeat(300), body: "", imageAlt: "" }));
    expect(result.ok).toBe(false);
    expect(saveOriginContent).not.toHaveBeenCalled();
  });

  it("saves valid text content", async () => {
    const result = await updateOriginContentText("origin-1", formData({ headline: "The Sapphire Capital", body: "A short story.", imageAlt: "A sapphire mine" }));
    expect(result).toEqual({ ok: true });
    expect(saveOriginContent).toHaveBeenCalledWith("origin-1", { headline: "The Sapphire Capital", body: "A short story.", imageAlt: "A sapphire mine" });
  });

  it("404s (throws) for an origin id that doesn't exist", async () => {
    prismaMock.origin.findUniqueOrThrow.mockRejectedValue(new Error("not found"));
    await expect(updateOriginContentText("bad-id", formData({ headline: "x", body: "", imageAlt: "" }))).rejects.toThrow();
  });
});

describe("setOriginContentImage", () => {
  it("rejects when no file is provided", async () => {
    const result = await setOriginContentImage("origin-1", new FormData());
    expect(result).toEqual({ ok: false, error: "No file provided." });
    expect(saveUploadedMedia).not.toHaveBeenCalled();
  });

  it("rejects a non-image upload", async () => {
    vi.mocked(saveUploadedMedia).mockResolvedValue({ url: "https://x/y.mp4", type: "VIDEO" } as never);
    const fd = new FormData();
    fd.set("file", new File(["x"], "clip.mp4", { type: "video/mp4" }));
    const result = await setOriginContentImage("origin-1", fd);
    expect(result).toEqual({ ok: false, error: "Please upload an image file." });
    expect(saveOriginContent).not.toHaveBeenCalled();
  });

  it("saves the uploaded image's url", async () => {
    vi.mocked(saveUploadedMedia).mockResolvedValue({ url: "https://x/mine.jpg", type: "IMAGE" } as never);
    const fd = new FormData();
    fd.set("file", new File(["x"], "mine.jpg", { type: "image/jpeg" }));
    const result = await setOriginContentImage("origin-1", fd);
    expect(result).toEqual({ ok: true });
    expect(saveOriginContent).toHaveBeenCalledWith("origin-1", { image: "https://x/mine.jpg" });
  });
});
