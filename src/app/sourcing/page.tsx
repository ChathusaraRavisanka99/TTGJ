import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
    <div className="lg:grid lg:grid-cols-2 lg:items-stretch">
      {/* ---------- Image side ---------- */}
      {/* Deliberately NOT sticky: a pinned image next to a scrolling form
          reads as artificial — two different scroll speeds on the same
          screen, plus a gap while the sticky offset caught up with the
          fixed nav. Just a normal tall column, stretched to the content
          column's height via grid `items-stretch` + object-cover, that
          scrolls in sync with the page like everything else. */}
      <div className="relative h-64 sm:h-96 lg:h-full lg:min-h-[44rem]">
        <Image
          src="/images/heritage/sri-lanka-gem-trays.jpg"
          alt="Trays of loose faceted gemstones at a gem trading table in Sri Lanka"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(0deg, rgba(33,29,26,0.85) 0%, rgba(33,29,26,0.15) 45%, transparent 70%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-soft">Sourced Directly</p>
          <p className="mt-2 max-w-sm font-serif text-xl text-ivory sm:text-2xl">
            From Sri Lanka&apos;s gem markets and our network of trusted cutters.
          </p>
        </div>
      </div>

      {/* ---------- Content side ---------- */}
      <div className="flex items-center px-5 py-14 sm:px-8 sm:py-20 lg:px-16 lg:py-24 xl:px-20">
        <div className="w-full max-w-xl">
          <p className="text-xs uppercase tracking-widest text-gold">Bespoke Sourcing</p>
          <h1 className="mt-2 font-serif text-4xl text-charcoal sm:text-5xl">Can&apos;t find what you&apos;re looking for?</h1>
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
      </div>
    </div>
  );
}
