"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pickaxe, Gem, Sparkles } from "lucide-react";
import { playGemDigAction } from "@/actions/gem-dig";
import { Button } from "@/components/ui/Button";

type Phase = "ready" | "digging" | "revealed" | "error";

const PUNCHLINES = [
  "Somewhere in here is a little something extra.",
  "One good swing could turn up a surprise.",
  "Ratnavue's own gemologists dug for years for less.",
];

export function DigForGemAnimation({ orderId, min, max }: { orderId: string; min: number; max: number }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [points, setPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [punchline] = useState(() => PUNCHLINES[Math.floor(Math.random() * PUNCHLINES.length)]);

  async function handleDig() {
    setPhase("digging");
    setError(null);
    const [result] = await Promise.all([
      playGemDigAction(orderId),
      new Promise((r) => setTimeout(r, 1400)), // let the swing animation actually play
    ]);
    if (!result.ok) {
      setError(result.error);
      setPhase("error");
      return;
    }
    setPoints(result.points);
    setPhase("revealed");
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-gradient-to-b from-ivory-soft to-surface px-6 py-10 text-center">
      <AnimatePresence mode="wait">
        {phase !== "revealed" ? (
          <motion.div key="pickaxe" exit={{ opacity: 0, scale: 0.8 }} className="relative">
            <motion.div
              animate={phase === "digging" ? { rotate: [0, -35, 10, -25, 0], y: [0, 4, -2, 4, 0] } : { rotate: 0 }}
              transition={phase === "digging" ? { duration: 1.4, ease: "easeInOut" } : undefined}
            >
              <Pickaxe size={64} strokeWidth={1.25} className="text-gold-deep" />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="gem"
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="relative"
          >
            <Sparkles size={22} strokeWidth={1.5} className="absolute -right-3 -top-2 text-gold" />
            <Sparkles size={14} strokeWidth={1.5} className="absolute -left-4 bottom-1 text-gold/70" />
            <Gem size={64} strokeWidth={1.25} className="text-gold-deep" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 min-h-[4.5rem]">
        {phase === "ready" && (
          <>
            <p className="font-serif text-xl text-charcoal">Dig for a bonus gem</p>
            <p className="mt-2 text-sm text-charcoal/65">{punchline}</p>
            <p className="mt-1 text-xs text-charcoal/65">You&apos;ll turn up somewhere between {min.toLocaleString()} and {max.toLocaleString()} points.</p>
          </>
        )}
        {phase === "digging" && <p className="font-serif text-xl text-charcoal">Digging...</p>}
        {phase === "revealed" && points != null && (
          <>
            <p className="font-serif text-2xl text-gold-deep">+{points.toLocaleString()} points</p>
            <p className="mt-2 text-sm text-charcoal/65">Added to your rewards balance.</p>
          </>
        )}
        {phase === "error" && <p className="text-sm text-red-700">{error}</p>}
      </div>

      {phase === "ready" && (
        <Button type="button" variant="gold" size="lg" className="mt-4" onClick={handleDig}>
          Good luck
        </Button>
      )}

      {phase === "revealed" && (
        <p className="mt-6 max-w-sm text-xs text-charcoal/65">
          This is a one-time bonus for this order. Ratnavue may change or remove the rewards program at any time.
        </p>
      )}
    </div>
  );
}
