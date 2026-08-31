import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/media";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const filename = segments.join("/");

  // Prevent path traversal outside the upload directory.
  const resolved = path.resolve(UPLOAD_DIR, filename);
  if (!resolved.startsWith(UPLOAD_DIR)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    await stat(resolved);
    const buffer = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
