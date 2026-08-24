import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SourcingForm } from "@/components/quote/SourcingForm";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Gem Sourcing",
  description: "Can't find what you're looking for? Submit a sourcing request and our gemologists will find it for you.",
};

export default async function SourcingPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Bespoke Sourcing</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">Can&apos;t find what you&apos;re looking for?</h1>
      <p className="mt-4 leading-relaxed text-charcoal/70">
        Beyond our catalog, we source specific gemstones on request directly from Sri Lanka&apos;s gem markets and
        our network of cutters. Tell us what you have in mind and we&apos;ll get back to you.
      </p>

      <div className="mt-10">
        {session?.user ? (
          <SourcingForm />
        ) : (
          <div className="rounded-xl border border-border-subtle bg-ivory-soft p-6">
            <p className="text-sm text-charcoal/75">Sign in to submit a sourcing request.</p>
            <Link href="/account/login?callbackUrl=/sourcing">
              <Button variant="primary" className="mt-3">Sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
