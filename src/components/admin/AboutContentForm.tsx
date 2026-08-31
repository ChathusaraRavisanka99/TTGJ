"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAboutText } from "@/actions/page-content";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { AboutContent } from "@/lib/page-content";

export function AboutContentForm({ initial }: { initial: AboutContent }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await updateAboutText(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-8">
      <section>
        <p className="font-serif text-lg text-charcoal">Hero</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="heroKicker">Kicker</Label>
            <Input id="heroKicker" name="heroKicker" defaultValue={initial.heroKicker} />
          </div>
          <div>
            <Label htmlFor="heroHeading">Heading</Label>
            <Input id="heroHeading" name="heroHeading" defaultValue={initial.heroHeading} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Intro</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="introLabel">Side label</Label>
            <Input id="introLabel" name="introLabel" defaultValue={initial.introLabel} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="introLead">Lead sentence</Label>
            <Textarea id="introLead" name="introLead" defaultValue={initial.introLead} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="introBody1">Body — paragraph 1</Label>
            <Textarea id="introBody1" name="introBody1" defaultValue={initial.introBody1} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="introBody2">Body — paragraph 2</Label>
            <Textarea id="introBody2" name="introBody2" defaultValue={initial.introBody2} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Image break caption</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="breakCaptionKicker">Kicker</Label>
            <Input id="breakCaptionKicker" name="breakCaptionKicker" defaultValue={initial.breakCaptionKicker} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="breakCaptionBody">Body</Label>
            <Textarea id="breakCaptionBody" name="breakCaptionBody" defaultValue={initial.breakCaptionBody} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Pull quote</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quote">Quote</Label>
            <Input id="quote" name="quote" defaultValue={initial.quote} />
          </div>
          <div>
            <Label htmlFor="quoteHighlight">Highlighted ending</Label>
            <Input id="quoteHighlight" name="quoteHighlight" defaultValue={initial.quoteHighlight} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Principles (three columns)</p>
        <div className="mt-3 grid gap-6 sm:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="space-y-3">
              <div>
                <Label htmlFor={`principle${n}Title`}>{`0${n}`} Title</Label>
                <Input id={`principle${n}Title`} name={`principle${n}Title`} defaultValue={initial[`principle${n}Title`]} />
              </div>
              <div>
                <Label htmlFor={`principle${n}Body`}>Body</Label>
                <Textarea id={`principle${n}Body`} name={`principle${n}Body`} defaultValue={initial[`principle${n}Body`]} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="font-serif text-lg text-charcoal">Closing CTA</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ctaHeading">Heading</Label>
            <Input id="ctaHeading" name="ctaHeading" defaultValue={initial.ctaHeading} />
          </div>
          <div>
            <Label htmlFor="ctaBody">Body</Label>
            <Textarea id="ctaBody" name="ctaBody" defaultValue={initial.ctaBody} />
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
