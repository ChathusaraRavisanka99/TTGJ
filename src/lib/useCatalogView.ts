"use client";

import { useEffect, useState } from "react";

export type CatalogView = "grid" | "list";

const STORAGE_KEY = "ratnavue-catalog-view";

// Shared between /gems and /jewelry (one preference, not one per page) —
// browsing one catalog in list view and the other in grid would be a
// strange thing to remember separately, and most people just have one
// preferred way to scan a list of products.
//
// Always starts at "grid" (matching what the server rendered) and only
// switches to a remembered "list" after mount, in an effect — reading
// localStorage during the initial render would make the client's first
// render disagree with the server's, which React flags as a hydration
// mismatch. The one-frame flip from grid to list on a repeat visit is the
// deliberate trade-off for that.
export function useCatalogView(): [CatalogView, (view: CatalogView) => void] {
  const [view, setViewState] = useState<CatalogView>("grid");

  useEffect(() => {
    // Deliberately not a lazy useState initializer instead: reading
    // localStorage during render would make the client's first render
    // disagree with the server's (which has no localStorage at all),
    // which is a hydration mismatch — the whole reason this is an effect
    // rather than render logic is to defer the read until after
    // hydration, per React's own "synchronizing with an external system"
    // guidance. The set-state-in-effect lint rule doesn't distinguish
    // that from the "derived state" antipattern it actually targets.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "list" || stored === "grid") setViewState(stored);
    } catch {
      // localStorage unavailable (private mode, etc.) — just stay on grid.
    }
  }, []);

  function setView(next: CatalogView) {
    setViewState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-critical — the toggle still works for the rest of this visit.
    }
  }

  return [view, setView];
}
