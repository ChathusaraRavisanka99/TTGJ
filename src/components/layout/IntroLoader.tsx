"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const SESSION_KEY = "ratnavue-intro-seen";
const VISIBLE_MS = 2400;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_CURTAIN = [0.76, 0, 0.24, 1] as const;

export function IntroLoader() {
  const [phase, setPhase] = useState<"idle" | "visible" | "hidden">("idle");

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage unavailable (private mode, etc.) — just skip the intro.
    }

    if (seen) return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* non-fatal */
    }

    setPhase("visible");
    // No cleanup here on purpose: this component is mounted once for the
    // app's lifetime, and returning a clearTimeout cleanup makes this timer
    // a casualty of React StrictMode's dev-only mount→cleanup→remount pass
    // (its cleanup fires between the two effect invocations, and the second
    // invocation is a no-op because `seen` is now true) — the loader would
    // show and then simply never dismiss in development.
    setTimeout(() => setPhase("hidden"), VISIBLE_MS);
  }, []);

  useEffect(() => {
    if (phase === "visible") {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prev;
      };
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {phase === "visible" && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-charcoal"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 1, ease: EASE_CURTAIN }}
        >
          <motion.div
            className="flex flex-col items-center"
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.05em" }}
              animate={{ opacity: 1, letterSpacing: "0.5em" }}
              transition={{ duration: 1.1, ease: EASE_OUT }}
              className="mb-5 text-[10px] uppercase text-gold-soft"
            >
              Ceylon Gemstones
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.12em" }}
              transition={{ duration: 1.3, ease: EASE_OUT }}
              className="font-serif text-4xl text-ivory sm:text-6xl"
            >
              RATNAVUE
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.9, ease: EASE_OUT }}
              className="mt-7 h-px w-40 bg-gold sm:w-56"
            />

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="mt-5 text-[10px] uppercase tracking-[0.35em] text-ivory/50"
            >
              Est. Ratnapura, Sri Lanka
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
