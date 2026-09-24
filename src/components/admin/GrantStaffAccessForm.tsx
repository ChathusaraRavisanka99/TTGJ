"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchUsersForStaff, grantStaffAccess } from "@/actions/staff";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { STAFF_AREAS, STAFF_AREA_LABELS } from "@/lib/staff-permissions";

type Candidate = { id: string; name: string | null; email: string };

/** Makes an EXISTING account staff: find them by email or name, pick the
 * areas and store(s), done — they keep their own password. (A brand-new
 * person is created with CreateStaffAccountForm instead.) Plain onClick
 * handlers, no <form action>, matching the rest of the staff screens. */
export function GrantStaffAccessForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [scope, setScope] = useState("intl");
  const [areas, setAreas] = useState<string[]>(["orders"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setQuery("");
    setResults(null);
    setSelected(null);
    setScope("intl");
    setAreas(["orders"]);
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleSearch() {
    setError(null);
    setPending(true);
    try {
      setResults(await searchUsersForStaff(query));
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleGrant() {
    if (!selected) return;
    setError(null);
    setPending(true);
    try {
      const result = await grantStaffAccess(selected.id, scope, areas);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>Add Existing User</Button>
      <Modal open={open} onClose={close} title="Give an existing user staff access">
        <div className="space-y-4">
          {!selected ? (
            <>
              <div>
                <Label htmlFor="gs-query">Find by email or name</Label>
                <div className="flex gap-2">
                  <Input
                    id="gs-query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSearch();
                      }
                    }}
                    placeholder="At least 2 characters"
                  />
                  <Button type="button" variant="gold" disabled={pending || query.trim().length < 2} onClick={handleSearch}>Search</Button>
                </div>
              </div>
              {results && results.length === 0 && <p className="text-sm text-charcoal/60">No matching customer accounts. Admins and existing staff aren&apos;t listed.</p>}
              {results && results.length > 0 && (
                <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
                  {results.map((u) => (
                    <li key={u.id}>
                      <button type="button" onClick={() => setSelected(u)} className="flex w-full flex-col px-3 py-2 text-left hover:bg-ivory-soft">
                        <span className="text-sm text-charcoal">{u.name ?? u.email}</span>
                        {u.name && <span className="text-xs text-charcoal/60">{u.email}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-ivory-soft px-3 py-2">
                <span className="text-sm text-charcoal">
                  {selected.name ?? selected.email}
                  <span className="block text-xs text-charcoal/60">{selected.email}</span>
                </span>
                <button type="button" className="text-xs text-gold underline" onClick={() => setSelected(null)}>Change</button>
              </div>
              <div>
                <Label htmlFor="gs-scope">Store access</Label>
                <Select id="gs-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="intl">International only</option>
                  <option value="lk">Sri Lanka only</option>
                  <option value="both">Both stores</option>
                </Select>
              </div>
              <fieldset>
                <legend className="mb-1 text-sm font-medium text-charcoal">What they can manage</legend>
                <div className="space-y-2">
                  {STAFF_AREAS.map((area) => (
                    <label key={area} className="flex items-start gap-2 text-sm text-charcoal/80">
                      <input
                        type="checkbox"
                        checked={areas.includes(area)}
                        onChange={(e) => setAreas(e.target.checked ? [...areas, area] : areas.filter((a) => a !== area))}
                        className="mt-1 accent-gold"
                      />
                      <span>
                        <span className="font-medium text-charcoal">{STAFF_AREA_LABELS[area].label}</span>
                        <span className="block text-xs text-charcoal/55">{STAFF_AREA_LABELS[area].description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <FieldError>{error ?? undefined}</FieldError>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            {selected && (
              <Button type="button" variant="gold" disabled={pending || areas.length === 0} onClick={handleGrant}>
                {pending ? "Saving..." : "Give staff access"}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
