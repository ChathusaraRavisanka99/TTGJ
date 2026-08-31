"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomeText } from "@/actions/page-content";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { HomeContent } from "@/lib/page-content";

export function HomeContentForm({ initial }: { initial: HomeContent }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await updateHomeText(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-8">
      <section>
        <p className="font-serif text-lg text-charcoal">Hero</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="heroKicker">Kicker</Label>
            <Input id="heroKicker" name="heroKicker" defaultValue={initial.heroKicker} />
          </div>
          <div>
            <Label htmlFor="heroHeadingLine1">Heading — line 1</Label>
            <Input id="heroHeadingLine1" name="heroHeadingLine1" defaultValue={initial.heroHeadingLine1} />
          </div>
          <div>
            <Label htmlFor="heroHeadingLine2">Heading — line 2</Label>
            <Input id="heroHeadingLine2" name="heroHeadingLine2" defaultValue={initial.heroHeadingLine2} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="heroHeadingHighlight">Heading — highlighted line</Label>
            <Input id="heroHeadingHighlight" name="heroHeadingHighlight" defaultValue={initial.heroHeadingHighlight} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="heroSubtext">Subtext</Label>
            <Textarea id="heroSubtext" name="heroSubtext" defaultValue={initial.heroSubtext} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Heritage banner</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="heritageKicker">Kicker</Label>
            <Input id="heritageKicker" name="heritageKicker" defaultValue={initial.heritageKicker} />
          </div>
          <div>
            <Label htmlFor="heritageHeading">Heading</Label>
            <Input id="heritageHeading" name="heritageHeading" defaultValue={initial.heritageHeading} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="heritageBody">Body</Label>
            <Textarea id="heritageBody" name="heritageBody" defaultValue={initial.heritageBody} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Sourcing banner</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sourcingKicker">Kicker</Label>
            <Input id="sourcingKicker" name="sourcingKicker" defaultValue={initial.sourcingKicker} />
          </div>
          <div>
            <Label htmlFor="sourcingHeading">Heading</Label>
            <Input id="sourcingHeading" name="sourcingHeading" defaultValue={initial.sourcingHeading} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sourcingBody">Body</Label>
            <Textarea id="sourcingBody" name="sourcingBody" defaultValue={initial.sourcingBody} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Editorial quote</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="editorialQuote">Quote</Label>
            <Textarea id="editorialQuote" name="editorialQuote" defaultValue={initial.editorialQuote} />
          </div>
          <div>
            <Label htmlFor="editorialQuoteHighlight">Highlighted ending</Label>
            <Input id="editorialQuoteHighlight" name="editorialQuoteHighlight" defaultValue={initial.editorialQuoteHighlight} />
          </div>
          <div>
            <Label htmlFor="editorialAttribution">Attribution</Label>
            <Input id="editorialAttribution" name="editorialAttribution" defaultValue={initial.editorialAttribution} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Closing CTA</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="closingKicker">Kicker</Label>
            <Input id="closingKicker" name="closingKicker" defaultValue={initial.closingKicker} />
          </div>
          <div>
            <Label htmlFor="closingHeading">Heading</Label>
            <Input id="closingHeading" name="closingHeading" defaultValue={initial.closingHeading} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="closingBody">Body</Label>
            <Textarea id="closingBody" name="closingBody" defaultValue={initial.closingBody} />
          </div>
        </div>
      </section>

      <FieldError>{error ?? undefined}</FieldError>

      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? "Saving..." : "Save Text Changes"}
      </Button>
    </form>
  );
}
