import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getOriginContent, getAllOriginContent, saveOriginContent, DEFAULT_ORIGIN_CONTENT } from "@/lib/origin-content";

beforeEach(() => {
  prismaMock.pageContent.findUnique.mockReset();
  prismaMock.pageContent.findMany.mockReset();
  prismaMock.pageContent.upsert.mockReset();
});

describe("getOriginContent", () => {
  it("returns the empty defaults when nothing has been written for this origin", async () => {
    prismaMock.pageContent.findUnique.mockResolvedValue(null);
    const content = await getOriginContent("origin-1");
    expect(content).toEqual(DEFAULT_ORIGIN_CONTENT);
    expect(prismaMock.pageContent.findUnique).toHaveBeenCalledWith({ where: { page: "origin:origin-1" } });
  });

  it("returns saved content merged over the defaults", async () => {
    prismaMock.pageContent.findUnique.mockResolvedValue({ id: "x", page: "origin:origin-1", data: { headline: "The Sapphire Capital" }, updatedAt: new Date() } as never);
    const content = await getOriginContent("origin-1");
    expect(content.headline).toBe("The Sapphire Capital");
    expect(content.body).toBe(""); // still the default for a field not saved
  });
});

describe("getAllOriginContent", () => {
  it("returns an empty map for an empty id list without querying", async () => {
    const result = await getAllOriginContent([]);
    expect(result.size).toBe(0);
    expect(prismaMock.pageContent.findMany).not.toHaveBeenCalled();
  });

  it("batches multiple origins into one query and defaults any without saved content", async () => {
    prismaMock.pageContent.findMany.mockResolvedValue([
      { id: "x", page: "origin:origin-1", data: { headline: "Ratnapura" }, updatedAt: new Date() },
    ] as never);
    const result = await getAllOriginContent(["origin-1", "origin-2"]);
    expect(result.get("origin-1")?.headline).toBe("Ratnapura");
    expect(result.get("origin-2")).toEqual(DEFAULT_ORIGIN_CONTENT);
    expect(prismaMock.pageContent.findMany).toHaveBeenCalledWith({ where: { page: { in: ["origin:origin-1", "origin:origin-2"] } } });
  });
});

describe("saveOriginContent", () => {
  it("merges the new fields onto whatever was already saved", async () => {
    prismaMock.pageContent.findUnique.mockResolvedValue({ id: "x", page: "origin:origin-1", data: { headline: "Old headline", body: "Existing body" }, updatedAt: new Date() } as never);
    await saveOriginContent("origin-1", { headline: "New headline" });
    expect(prismaMock.pageContent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { page: "origin:origin-1" },
        update: { data: expect.objectContaining({ headline: "New headline", body: "Existing body" }) },
      }),
    );
  });
});
