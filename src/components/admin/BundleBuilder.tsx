"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchAvailableCatalogItems, type CatalogSearchResult } from "@/actions/manual-sale";
import { createBundle } from "@/actions/bundles";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { Market } from "@/lib/market-shared";

interface Line {
  key: string;
  gemstoneId?: string;
  jewelryId?: string;
  label: string;
  price: number | null;
}

export function BundleBuilder() {
  const router = useRouter();
  const [market, setMarket] = useState<Market>("intl");
  const [itemQuery, setItemQuery] = useState("");
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [resultsFor, setResultsFor] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const requestIdRef = useRef(0);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const trimmedQuery = itemQuery.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) return;
    const thisRequestId = ++requestIdRef.current;
    const timer = setTimeout(() => {
      searchAvailableCatalogItems(market, trimmedQuery).then((found) => {
        if (thisRequestId === requestIdRef.current) {
          setResults(found);
          setResultsFor(trimmedQuery);
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [trimmedQuery, market]);

  const searching = trimmedQuery.length >= 2 && resultsFor !== trimmedQuery;
  const visibleResults = trimmedQuery.length < 2 ? [] : results;

  const individualTotal = lines.reduce((sum, l) => sum + (l.price ?? 0), 0);

  function addLine(line: Line) {
    setLines((prev) => (prev.some((l) => l.key === line.key) ? prev : [...prev, line]));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function switchMarket(next: Market) {
    setMarket(next);
    setLines([]); // a bundle can't mix stores — starting over avoids a stale cross-store selection
    setItemQuery("");
    setResults([]);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (lines.length < 2) {
      setError("Add at least 2 items.");
      return;
    }
    formData.set("market", market);
    formData.set("items", JSON.stringify(lines.map((l) => ({ gemstoneId: l.gemstoneId, jewelryId: l.jewelryId }))));
    setPending(true);
    try {
      const result = await createBundle(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setPrice("");
      setLines([]);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5 rounded-xl border border-border-subtle bg-surface p-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="bundle-market">Store</Label>
          <Select id="bundle-market" value={market} onChange={(e) => switchMarket(e.target.value as Market)}>
            <option value="intl">International</option>
            <option value="lk">Sri Lanka</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="bundle-name">Name</Label>
          <Input id="bundle-name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sapphire Ring + Matching Studs" required />
        </div>
        <div>
          <Label htmlFor="bundle-price">Bundle Price ({market === "lk" ? "Rs" : "$"})</Label>
          <Input id="bundle-price" name="price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
      </div>

      <div>
        <Label htmlFor="bundle-item-search">Add items ({market === "lk" ? "Sri Lanka store" : "International store"})</Label>
        <Input id="bundle-item-search" value={itemQuery} onChange={(e) => setItemQuery(e.target.value)} placeholder="Search available gemstones or jewelry..." />
        {trimmedQuery.length >= 2 && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border-subtle">
            {searching ? (
              <p className="p-3 text-sm text-charcoal/50">Searching...</p>
            ) : visibleResults.length === 0 ? (
              <p className="p-3 text-sm text-charcoal/50">No available items match.</p>
            ) : (
              visibleResults.map((item) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() =>
                    addLine({
                      key: `${item.kind}-${item.id}`,
                      gemstoneId: item.kind === "gemstone" ? item.id : undefined,
                      jewelryId: item.kind === "jewelry" ? item.id : undefined,
                      label: item.name,
                      price: item.price,
                    })
                  }
                  className="flex w-full items-center justify-between border-b border-border-subtle px-3 py-2 text-left text-sm last:border-0 hover:bg-ivory-soft"
                >
                  <span className="text-charcoal">{item.name}</span>
                  <span className="text-charcoal/60">{item.price != null ? formatPrice(item.price, market === "lk" ? "LKR" : "USD") : "No price"}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <div className="rounded-lg border border-border-subtle">
          {lines.map((line) => (
            <div key={line.key} className="flex items-center justify-between gap-3 border-b border-border-subtle px-3 py-2 text-sm last:border-0">
              <span className="text-charcoal">{line.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-charcoal/60">{line.price != null ? formatPrice(line.price, market === "lk" ? "LKR" : "USD") : "No price"}</span>
                <button type="button" onClick={() => removeLine(line.key)} className="text-xs text-red-700 underline">
                  Remove
                </button>
              </div>
            </div>
          ))}
          <p className="border-t border-border-subtle px-3 py-2 text-xs text-charcoal/60">
            Individually: {formatPrice(individualTotal, market === "lk" ? "LKR" : "USD")}
            {price && Number(price) > 0 && ` — Bundled saves ${formatPrice(Math.max(0, individualTotal - Number(price)), market === "lk" ? "LKR" : "USD")}`}
          </p>
        </div>
      )}

      <FieldError>{error ?? undefined}</FieldError>
      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? "Creating..." : "Create Bundle"}
      </Button>
    </form>
  );
}
