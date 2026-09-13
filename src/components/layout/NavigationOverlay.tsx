"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Safety net in case `pathname` never actually changes after a click that
// looked like a navigation (the router cancels it, a client-side error
// stops it, etc.) — without this the overlay would otherwise sit there
// forever.
const MAX_PENDING_MS = 4000;

/**
 * A blur overlay that appears the instant an internal link is clicked and
 * clears once the navigation actually lands — the "current page goes a bit
 * blurry" half of the loading experience (loading.tsx's PageLoader, a
 * proper branded full-screen loader, is the other half — it already
 * appears on its own for genuinely slow loads via Suspense, no
 * coordination needed here: it renders inside <main>, which sits *behind*
 * this overlay, so if it shows up while this is still up, it just reads
 * through the blur like everything else does). Also renders a small
 * "Getting things ready for you..." pill, mobile-only — see its own
 * comment below for why a narrow viewport needs that and a desktop one
 * doesn't.
 *
 * Deliberately NOT implemented by holding the outgoing page's content in
 * component state and swapping it after a delay (an earlier version did
 * exactly that) — verified live that Next's Suspense-streamed `children`
 * and `usePathname()` don't always update in lockstep, so "snapshot the
 * old children" sometimes ended up snapshotting the *new* route's loader
 * instead of the actual outgoing page. A `backdrop-blur` layer sitting on
 * top of whatever's currently painted sidesteps that: it doesn't need to
 * know or care what's underneath, or when it changes.
 *
 * "Is a navigation starting" is detected from the triggering click itself
 * (a capture-phase document listener) rather than any router state, since
 * that's the one signal that's unambiguous and strictly precedes
 * everything else changing.
 */
export function NavigationOverlay() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // The new route has actually arrived — clear immediately. Done directly
  // during render (React's documented "adjusting state when a prop
  // changes" pattern) rather than inside a useEffect body, since an
  // effect that calls setState synchronously in its own body just to
  // react to a prop change causes an extra wasted render pass.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (pending) setPending(false);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // External links, same-page anchors (#section), and links to the
      // page already showing (see AccountMenu's "already here" links)
      // never get the overlay.
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setPending(true);
    }
    // Capture phase: fires before the click reaches <Link>'s own handler.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(false), MAX_PENDING_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-40 bg-charcoal/10 backdrop-blur-[2px] transition-opacity duration-200",
          pending ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Mobile-only: a plain blur reads fine on a big desktop viewport
          (there's still a whole page of now-fuzzy content around it
          signalling "something's happening"), but on a narrow phone
          screen the same blur can look indistinguishable from the app
          just being stuck — there's barely anything else on screen to
          read as "in motion." This pill is the unambiguous "no really,
          it's working" signal for that case specifically. */}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2 transition-all duration-200 sm:hidden",
          pending ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        )}
      >
        <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-charcoal px-4 py-2.5 text-sm text-ivory shadow-lg">
          <Loader2 size={15} className="shrink-0 animate-spin text-gold-soft" />
          Getting things ready for you...
        </div>
      </div>
    </>
  );
}
