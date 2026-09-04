"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSeasonalContent } from "@/actions/page-content";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SEASONAL_THEMES } from "@/lib/seasonal-themes";
import type { SeasonalContent } from "@/lib/page-content";

export function SeasonalContentForm({ initial }: { initial: SeasonalContent }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    setPending(true);
    const result = await updateSeasonalContent(formData);
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
        <Label htmlFor="theme">Theme</Label>
        <Select id="theme" name="theme" defaultValue={initial.theme}>
          {Object.values(SEASONAL_THEMES).map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </Select>
      </div>
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
