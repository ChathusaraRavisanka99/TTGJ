import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { isCompleteOrder, parseDraftMedia, attachDraftMedia, applyMediaOrder } from "@/lib/media-gallery";
import { inspectDirectUpload } from "@/lib/media";

vi.mock("@/lib/media", () => ({ inspectDirectUpload: vi.fn() }));

describe("isCompleteOrder", () => {
  it("accepts any permutation of the existing ids", () => {
    expect(isCompleteOrder(["b", "c", "a"], ["a", "b", "c"])).toBe(true);
    expect(isCompleteOrder([], [])).toBe(true);
  });

  it("rejects missing, extra, repeated and foreign ids", () => {
    expect(isCompleteOrder(["a"], ["a", "b"])).toBe(false);
    expect(isCompleteOrder(["a", "b", "c"], ["a", "b"])).toBe(false);
    expect(isCompleteOrder(["a", "a"], ["a", "b"])).toBe(false);
    expect(isCompleteOrder(["a", "x"], ["a", "b"])).toBe(false);
  });
});

describe("parseDraftMedia", () => {
  it("reads the ordered list from the form field", () => {
    expect(parseDraftMedia(JSON.stringify([{ key: "a.jpg" }, { key: "b.mp4", altText: "spin" }]))).toEqual([{ key: "a.jpg", altText: undefined }, { key: "b.mp4", altText: "spin" }]);
  });

  it("ignores anything malformed instead of failing the save", () => {
    expect(parseDraftMedia(undefined)).toEqual([]);
    expect(parseDraftMedia("")).toEqual([]);
    expect(parseDraftMedia("not json")).toEqual([]);
    expect(parseDraftMedia('{"key":"a"}')).toEqual([]);
    expect(parseDraftMedia(JSON.stringify([{ key: 5 }, null, "x", { key: "ok.jpg" }]))).toEqual([{ key: "ok.jpg", altText: undefined }]);
  });

  it("caps the list at 30 files", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ key: `${i}.jpg` }));
    expect(parseDraftMedia(JSON.stringify(many))).toHaveLength(30);
  });
});

describe("attachDraftMedia", () => {
  it("attaches in order, first one primary, defaulting alt text to the item name", async () => {
    vi.mocked(inspectDirectUpload).mockResolvedValueOnce({ url: "/media/a.jpg", type: "IMAGE" }).mockResolvedValueOnce({ url: "/media/b.mp4", type: "VIDEO" });
    prismaMock.mediaAsset.create.mockResolvedValue({} as never);

    const n = await attachDraftMedia({ gemstoneId: "gem-1" }, [{ key: "a.jpg" }, { key: "b.mp4", altText: "spin" }], "Blue Sapphire");

    expect(n).toBe(2);
    expect(prismaMock.mediaAsset.create).toHaveBeenNthCalledWith(1, { data: { url: "/media/a.jpg", type: "IMAGE", altText: "Blue Sapphire", isPrimary: true, sortOrder: 0, gemstoneId: "gem-1" } });
    expect(prismaMock.mediaAsset.create).toHaveBeenNthCalledWith(2, { data: { url: "/media/b.mp4", type: "VIDEO", altText: "spin", isPrimary: false, sortOrder: 1, gemstoneId: "gem-1" } });
  });

  it("skips a file that never finished uploading and still makes the next one first", async () => {
    vi.mocked(inspectDirectUpload).mockRejectedValueOnce(new Error("missing")).mockResolvedValueOnce({ url: "/media/b.jpg", type: "IMAGE" });
    prismaMock.mediaAsset.create.mockResolvedValue({} as never);

    const n = await attachDraftMedia({ jewelryId: "j-1" }, [{ key: "bad.jpg" }, { key: "b.jpg" }], "Ring");

    expect(n).toBe(1);
    expect(prismaMock.mediaAsset.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.mediaAsset.create).toHaveBeenCalledWith({ data: expect.objectContaining({ isPrimary: true, sortOrder: 0, jewelryId: "j-1" }) });
  });
});

describe("applyMediaOrder", () => {
  it("writes each position and marks only the first as primary", async () => {
    prismaMock.mediaAsset.update.mockResolvedValue({} as never);
    prismaMock.$transaction.mockResolvedValue([] as never);
    await applyMediaOrder(["x", "y"]);
    expect(prismaMock.mediaAsset.update).toHaveBeenCalledWith({ where: { id: "x" }, data: { sortOrder: 0, isPrimary: true } });
    expect(prismaMock.mediaAsset.update).toHaveBeenCalledWith({ where: { id: "y" }, data: { sortOrder: 1, isPrimary: false } });
  });
});
