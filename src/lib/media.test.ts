import { describe, it, expect } from "vitest";
import { looksLikeVideo, saveUploadedMedia } from "@/lib/media";

function fakeFile(bytes: number[], type: string, name = "test"): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("looksLikeVideo", () => {
  it("accepts a real WebM magic number", () => {
    expect(looksLikeVideo(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]), "video/webm")).toBe(true);
  });

  it("rejects arbitrary bytes claiming to be WebM", () => {
    expect(looksLikeVideo(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]), "video/webm")).toBe(false);
  });

  it("accepts a real MP4/ISO-BMFF ftyp box", () => {
    // [size(4 bytes)] "ftyp" [rest]
    const buf = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftyp", "ascii"), Buffer.alloc(4)]);
    expect(looksLikeVideo(buf, "video/mp4")).toBe(true);
  });

  it("accepts a QuickTime .mov starting with a moov box", () => {
    const buf = Buffer.concat([Buffer.from([0, 0, 0, 0x08]), Buffer.from("moov", "ascii")]);
    expect(looksLikeVideo(buf, "video/quicktime")).toBe(true);
  });

  it("rejects arbitrary bytes claiming to be MP4 (the exact gap this closes)", () => {
    expect(looksLikeVideo(Buffer.from("this is just some text pretending to be a video file"), "video/mp4")).toBe(false);
  });

  it("rejects a buffer too short to contain a box header", () => {
    expect(looksLikeVideo(Buffer.from([1, 2, 3]), "video/mp4")).toBe(false);
  });

  it("returns false for an unrecognized mime type", () => {
    expect(looksLikeVideo(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), "video/x-flv")).toBe(false);
  });
});

describe("saveUploadedMedia — validation guards (all throw before any storage/S3 call)", () => {
  it("rejects an unsupported file type", async () => {
    await expect(saveUploadedMedia(fakeFile([1, 2, 3], "application/zip"))).rejects.toThrow(/unsupported file type/i);
  });

  it("rejects an empty file", async () => {
    await expect(saveUploadedMedia(fakeFile([], "image/jpeg"))).rejects.toThrow(/empty/i);
  });

  it("rejects a file over the explicit action-upload size cap", async () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024)], "big.mp4", { type: "video/mp4" });
    await expect(saveUploadedMedia(big)).rejects.toThrow(/at most/i);
  });

  it("rejects a video file whose content doesn't match its claimed type", async () => {
    const fakeVideo = fakeFile(Array.from(Buffer.from("not actually a video")), "video/mp4");
    await expect(saveUploadedMedia(fakeVideo)).rejects.toThrow(/doesn't look like a valid video/i);
  });
});
