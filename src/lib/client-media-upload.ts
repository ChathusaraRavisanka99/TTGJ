import { requestProductMediaUpload } from "@/actions/media";
import { compressImage, putWithProgress } from "@/lib/client-image";

export const MEDIA_ACCEPT = "image/*,video/mp4,video/webm,video/quicktime";
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Uploads one photo or video straight from the browser to storage and
 * returns its storage key. One file at a time, straight to storage (see
 * lib/media.ts): a Server Action would cap each file at the action body
 * limit, which a phone photo or any video blows past. Photos are compressed
 * first. Throws a readable Error on any failure. */
export async function uploadProductFile(file: File, onStatus: (message: string) => void, label = ""): Promise<{ key: string; type: "IMAGE" | "VIDEO" }> {
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isVideo && !file.type.startsWith("image/")) {
    throw new Error(`${file.name}: unsupported file type. Use JPEG/PNG/WEBP images or MP4/WEBM/MOV videos.`);
  }

  onStatus(`${label} Preparing ${file.name}...`.trim());
  const prepared = isVideo ? { blob: file as Blob, contentType: file.type } : await compressImage(file);

  const signed = await requestProductMediaUpload({ contentType: prepared.contentType, size: prepared.blob.size });
  if (!signed.ok) throw new Error(`${file.name}: ${signed.error}`);

  await putWithProgress(signed.uploadUrl, prepared.blob, prepared.contentType, (fraction) =>
    onStatus(`${label} Uploading ${file.name} — ${Math.round(fraction * 100)}%`.trim()),
  );
  return { key: signed.key, type: isVideo ? "VIDEO" : "IMAGE" };
}
