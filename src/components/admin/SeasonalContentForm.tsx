"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSeasonalThemeCopy, setActiveSeasonalTheme } from "@/actions/page-content";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SEASONAL_THEMES, SEASONAL_THEME_KEYS, type SeasonalThemeKey } from "@/lib/seasonal-themes";
import type { SeasonalContent, SeasonalThemeCopy } from "@/lib/page-content";
import { cn } from "@/lib/utils";

// Every theme's copy is predefined and independently editable — switching
// tabs never loses an edit, since each tab is its own form with its own
// Save button. `activeTheme` (which one currently renders on the live
// page) is a separate concern from editing a theme's copy, same as
// picking which hero slide shows versus editing a slide.
export function SeasonalContentForm({ initial }: { initial: SeasonalContent }) {
  const router = useRouter();
  const [tab, setTab] = useState<SeasonalThemeKey>(initial.activeTheme);
  const [activeTheme, setActiveThemeState] = useState(initial.activeTheme);
  const [activePending, startActiveTransition] = useTransition();
  const [activeError, setActiveError] = useState<string | null>(null);

  function handleMakeActive(theme: SeasonalThemeKey) {
    setActiveError(null);
    startActiveTransition(async () => {
      const result = await setActiveSeasonalTheme(theme);
      if (!result.ok) {
        setActiveError(result.error);
        return;
      }
      setActiveThemeState(theme);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {SEASONAL_THEME_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              tab === key ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70 hover:border-charcoal/40",
            )}
          >
            {SEASONAL_THEMES[key].label}
            {activeTheme === key && <span className="ml-1.5 text-gold">●</span>}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-charcoal/50">
        {activeTheme === tab
          ? "This theme is currently live on /promotions."
          : "Not the live theme right now — edits below are saved but won't show until it's made active."}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="button"
          variant={activeTheme === tab ? "outline" : "gold"}
          size="sm"
          disabled={activePending || activeTheme === tab}
          onClick={() => handleMakeActive(tab)}
        >
          {activeTheme === tab ? "Currently Active" : activePending ? "Making Active..." : "Make Active"}
        </Button>
        <FieldError>{activeError ?? undefined}</FieldError>
      </div>

      <div className="mt-6 border-t border-border-subtle pt-6">
        {/* Remounts on tab change so each theme's uncontrolled inputs
            reset to that theme's own saved values, not the previous
            tab's. */}
        <SeasonalThemeCopyEditor key={tab} theme={tab} initial={initial.themes[tab]} />
      </div>
    </div>
  );
}

function SeasonalThemeCopyEditor({ theme, initial }: { theme: SeasonalThemeKey; initial: SeasonalThemeCopy }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    setPending(true);
    const result = await updateSeasonalThemeCopy(theme, formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-4">
      <div>
        <Label htmlFor="kicker">Kicker</Label>
        <Input id="kicker" name="kicker" defaultValue={initial.kicker} />
      </div>
      <div>
        <Label htmlFor="heading">Heading</Label>
        <Input id="heading" name="heading" defaultValue={initial.heading} />
      </div>
      <div>
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" name="body" defaultValue={initial.body} />
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <Label htmlFor="ctaLabel">Button Label</Label>
          <Input id="ctaLabel" name="ctaLabel" defaultValue={initial.ctaLabel} className="w-48" />
        </div>
        <div>
          <Label htmlFor="ctaHref">Button Link</Label>
          <Input id="ctaHref" name="ctaHref" defaultValue={initial.ctaHref} placeholder="/gems" className="w-48" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="gold" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        {saved && !error && <span className="text-sm text-green-700">Saved.</span>}
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </form>
  );
}
