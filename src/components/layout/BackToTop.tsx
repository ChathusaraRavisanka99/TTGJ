"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Placed bottom-*left* deliberately — FloatingChatButton already owns
 * bottom-right (see its own fixed positioning), and this needs to never
 * collide with it regardless of whether a visitor is signed in (that
 * button only renders for signed-in users, so "just don't overlap when
 * both are visible" isn't a safe enough rule on its own).
 */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 left-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-charcoal shadow-md transition-transform hover:scale-105 md:bottom-8 md:left-8"
    >
      <ArrowUp size={18} />
    </button>
  );
}
