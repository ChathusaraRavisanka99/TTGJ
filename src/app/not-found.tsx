import type { Metadata } from "next";
import { GemMinerScene } from "@/components/illustrations/GemMinerScene";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div className="flex min-h-[75dvh] items-center justify-center px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <GemMinerScene className="mx-auto h-44 w-auto sm:h-56" />
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-gold">404</p>
        <h1 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">Still digging for that one.</h1>
        <p className="mt-4 text-charcoal/70">
          We searched the whole seam and came up empty — the page you&apos;re looking for doesn&apos;t exist, or has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <LinkButton href="/" variant="gold" size="lg">Back to Home</LinkButton>
          <LinkButton href="/gems" variant="outline" size="lg">Shop Gemstones</LinkButton>
        </div>
      </div>
    </div>
  );
}
