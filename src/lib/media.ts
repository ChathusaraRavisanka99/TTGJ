import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";

// Statically scoped (not env-driven) so bundlers can trace it without
// pulling the whole project into the server output.
const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export interface SavedMedia {
  url: string;
  type: "IMAGE" | "VIDEO";
}

export async function saveUploadedMedia(file: File): Promise<SavedMedia> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) {
    throw new Error("Unsupported file type. Please upload a JPEG/PNG/WEBP image or an MP4/WEBM video.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();

  if (isImage) {
    const filename = `${id}.webp`;
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(path.join(UPLOAD_DIR, filename), optimized);
    return { url: `/api/media/${filename}`, type: "IMAGE" };
  }

  const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const filename = `${id}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/api/media/${filename}`, type: "VIDEO" };
}

const CERT_DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

// Certification files (lab report scans) are a single attachment on the
// Gemstone itself, not a MediaAsset gallery entry — so this is deliberately
// separate from saveUploadedMedia rather than shoehorning a PDF through the
// IMAGE/VIDEO MediaType enum.
export async function saveCertificateFile(file: File): Promise<{ url: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  if (!CERT_DOCUMENT_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Please upload a PDF, JPEG, PNG, or WEBP certificate.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();

  if (file.type === "application/pdf") {
    const filename = `${id}.pdf`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return { url: `/api/media/${filename}` };
  }

  // Scanned/photographed certificates: optimize like any other image, but
  // keep more headroom than product photos so fine print stays legible.
  const filename = `${id}.webp`;
  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();
  await writeFile(path.join(UPLOAD_DIR, filename), optimized);
  return { url: `/api/media/${filename}` };
}

export { UPLOAD_DIR };
