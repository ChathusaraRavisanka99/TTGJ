"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SlideshowImage {
  src: string;
  alt: string;
}

const SLIDE_MS = 5500;

export function HeroSlideshow({ images, className }: { images: SlideshowImage[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  const active = images[index];

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <AnimatePresence initial={false}>
        <motion.div
          key={active.src}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: SLIDE_MS / 1000 + 1.4, ease: "linear" }}
          >
            <Image src={active.src} alt={active.alt} fill priority={index === 0} className="object-cover opacity-70" />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <div className="absolute bottom-8 right-5 z-10 flex gap-2 sm:right-8">
          {images.map((img, i) => (
            <button
              key={img.src}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === index ? "w-6 bg-gold" : "w-1.5 bg-ivory/40 hover:bg-ivory/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
