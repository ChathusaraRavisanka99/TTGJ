"use client";

import { useState } from "react";
import Image from "next/image";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  altText: string | null;
}

export function MediaGallery({ media, fallbackLabel }: { media: MediaItem[]; fallbackLabel: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex];

  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-ivory-soft text-charcoal/25">
        <Gem size={64} strokeWidth={1} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-ivory-soft">
        {active.type === "VIDEO" ? (
          <video src={active.url} controls className="h-full w-full object-cover" />
        ) : (
          <Image src={active.url} alt={active.altText ?? fallbackLabel} fill className="object-cover" priority />
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
                <Image src={item.url} alt="" fill className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
