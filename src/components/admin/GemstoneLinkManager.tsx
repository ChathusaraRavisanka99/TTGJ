"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkGemstoneToJewelry, unlinkGemstoneFromJewelry } from "@/actions/catalog-admin";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Field";

interface Link {
  id: string;
  gemstone: { id: string; name: string } | null;
  freeformDesc: string | null;
}

export function GemstoneLinkManager({ jewelryId, links, gemstones }: { jewelryId: string; links: Link[]; gemstones: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gemstoneId, setGemstoneId] = useState("");
  const [freeform, setFreeform] = useState("");

  return (
    <div>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm">
            <span>{link.gemstone?.name ?? link.freeformDesc}</span>
            <button
              type="button"
              className="text-xs text-red-700 hover:underline"
              onClick={() => startTransition(async () => { await unlinkGemstoneFromJewelry(link.id, jewelryId); router.refresh(); })}
            >
              Remove
            </button>
          </li>
        ))}
        {links.length === 0 && <p className="text-sm text-charcoal/50">No gemstones linked yet.</p>}
      </ul>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Select value={gemstoneId} onChange={(e) => setGemstoneId(e.target.value)} className="w-64">
            <option value="">Select a catalog gemstone...</option>
            {gemstones.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </div>
        <span className="text-xs text-charcoal/50">or</span>
        <Input placeholder="Freeform description" value={freeform} onChange={(e) => setFreeform(e.target.value)} className="w-64" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || (!gemstoneId && !freeform)}
          onClick={() =>
            startTransition(async () => {
              await linkGemstoneToJewelry(jewelryId, gemstoneId || null, freeform || null);
              setGemstoneId("");
              setFreeform("");
              router.refresh();
            })
          }
        >
          Link
        </Button>
      </div>
    </div>
  );
}
