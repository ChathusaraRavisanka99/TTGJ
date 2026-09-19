// Browser-side image preparation for direct-to-storage uploads (see
// lib/media.ts). A phone photo is routinely 3-10MB; resizing to a 1600px
// long edge and re-encoding mirrors what the server used to do with sharp
// (same cap, ~same quality), but before the bytes ever leave the device —
// so the upload is a few hundred KB instead of the original.

const MAX_EDGE = 1600;

async function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<{ blob: Blob; contentType: "image/webp" | "image/jpeg" }> {
  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF orientation, so a portrait phone photo
    // isn't uploaded sideways (the server-side version called .rotate()).
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image format isn't supported by your browser — please use a JPEG, PNG or WEBP file.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image in this browser.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Some browsers (older Safari) can't encode WEBP and silently return a
  // PNG for that request — detect it by the blob's actual type and fall
  // back to JPEG rather than uploading a much larger PNG.
  const webp = await encode(canvas, "image/webp", 0.82);
  if (webp && webp.type === "image/webp") return { blob: webp, contentType: "image/webp" };
  const jpeg = await encode(canvas, "image/jpeg", 0.85);
  if (jpeg) return { blob: jpeg, contentType: "image/jpeg" };
  throw new Error("Could not compress the image.");
}

// fetch() has no upload-progress events, and a 30MB video with no progress
// indicator looks exactly like a hang — so this uses XHR.
export function putWithProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage rejected the upload (${xhr.status}).`)));
    xhr.onerror = () => reject(new Error("Network error while uploading — check your connection and try again."));
    xhr.send(body);
  });
}
