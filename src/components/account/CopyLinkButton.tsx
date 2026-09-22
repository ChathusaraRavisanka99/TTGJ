"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** A read-only link field with a one-click copy button — used for the
 * referral share link and the business invite link, which are both meant
 * to be pasted elsewhere rather than clicked from here. */
export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable — the field is still
      // selectable/copyable by hand, so this just silently no-ops.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-ivory-soft px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-charcoal">{value}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-gold-deep transition-colors hover:bg-gold/10"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
