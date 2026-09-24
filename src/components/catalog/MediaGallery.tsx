"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Gem, ZoomIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  altText: string | null;
}

// Cursor-tracked zoom on the main photo, plus a full-screen lightbox for a
// closer, larger look — a colored gemstone's actual color/inclusions are
// exactly what a buyer needs to verify against the listing, the way James
// Allen/Angara's 40x diamond inspection view does for theirs. Video already
// has native playback controls, so only stills get the zoom affordance.
export function MediaGallery({ media, fallbackLabel }: { media: MediaItem[]; fallbackLabel: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const active = media[activeIndex];

  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-ivory-soft text-charcoal/25">
        <Gem size={64} strokeWidth={1} />
      </div>
    );
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoomOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div>
      <div
        ref={frameRef}
        className={cn("relative aspect-square overflow-hidden rounded-xl bg-ivory-soft", active.type !== "VIDEO" && "cursor-zoom-in")}
        onMouseMove={active.type !== "VIDEO" ? handleMouseMove : undefined}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onClick={active.type !== "VIDEO" ? () => setLightboxOpen(true) : undefined}
      >
        {active.type === "VIDEO" ? (
          <video src={active.url} controls className="h-full w-full object-cover" />
        ) : (
          <>
            <Image
              src={active.url}
              alt={active.altText ?? fallbackLabel}
              fill
              className="object-cover transition-transform duration-150 ease-out"
              style={zoomed ? { transform: "scale(2.2)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` } : undefined}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-charcoal/70 px-2.5 py-1 text-[11px] text-ivory">
              <ZoomIn size={12} /> Click to zoom
            </span>
          </>
        )}
      </div>
      {media.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {media.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                i === activeIndex ? "border-gold" : "border-transparent opacity-70"
              )}
            >
              {item.type === "VIDEO" ? (
                <video src={item.url} className="h-full w-full object-cover" />
              ) : (
                <Image src={item.url} alt="" fill className="object-cover" sizes="64px" />
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && active.type !== "VIDEO" && (
        <ImageLightbox src={active.url} alt={active.altText ?? fallbackLabel} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4 sm:p-10" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-charcoal/60 p-2 text-ivory transition-colors hover:bg-charcoal/80"
      >
        <X size={20} />
      </button>
      <div className="relative h-full w-full max-w-4xl">
        <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>,
    document.body,
  );
}
