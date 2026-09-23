"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Pure so it's testable without rendering (this project's Vitest config
 * is node-only for most files — see Reveal.tsx's own comment on the same
 * pattern). Clamps to all-zero once the target has passed, rather than
 * going negative. */
export function msToCountdownParts(ms: number): CountdownParts {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Digit({ value }: { value: number }) {
  const padded = String(value).padStart(2, "0");
  return (
    <span className="relative inline-block h-[1em] w-[1.6ch] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={padded}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {padded}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A scheduled auction's "starts in" countdown — ticks every second, and
 * refreshes the page once it hits zero so the SCHEDULED state naturally
 * gives way to the real OPEN/bidding UI without the visitor reloading by
 * hand. */
export function AuctionCountdown({ targetDate }: { targetDate: string }) {
  const router = useRouter();
  const target = new Date(targetDate).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // The first tick is deliberately async too (a macrotask, not a
    // synchronous setState call in the effect body) — same reasoning as
    // every other debounced/ticking effect in this codebase.
    const firstTick = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (now != null && now >= target) router.refresh();
  }, [now, target, router]);

  // Server-rendered markup can't know the visitor's clock — render
  // nothing until the first client tick lands, avoiding a hydration
  // mismatch rather than guessing.
  if (now == null) return null;

  const { days, hours, minutes, seconds } = msToCountdownParts(target - now);

  return (
    <div className="flex items-baseline gap-3 font-serif text-2xl text-charcoal tabular-nums">
      {days > 0 && (
        <span className="flex items-baseline gap-1">
          <Digit value={days} />
          <span className="text-xs font-sans uppercase tracking-wide text-charcoal/50">d</span>
        </span>
      )}
      <span className="flex items-baseline gap-1">
        <Digit value={hours} />
        <span className="text-xs font-sans uppercase tracking-wide text-charcoal/50">h</span>
      </span>
      <span className="flex items-baseline gap-1">
        <Digit value={minutes} />
        <span className="text-xs font-sans uppercase tracking-wide text-charcoal/50">m</span>
      </span>
      <span className="flex items-baseline gap-1">
        <Digit value={seconds} />
        <span className="text-xs font-sans uppercase tracking-wide text-charcoal/50">s</span>
      </span>
    </div>
  );
}
