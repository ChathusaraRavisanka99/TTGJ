import type { Metadata } from "next";
import { GemMinerScene } from "@/components/illustrations/GemMinerScene";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Access Denied", robots: { index: false } };

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[75dvh] items-center justify-center px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <GemMinerScene className="mx-auto h-44 w-auto sm:h-56" />
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-gold">Access Denied</p>
        <h1 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">Wrong shaft, this one&apos;s staff-only.</h1>
        <p className="mt-4 text-charcoal/70">
          Your account doesn&apos;t have access to this area. If you think that&apos;s wrong, contact an administrator.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <LinkButton href="/" variant="gold" size="lg">Back to Home</LinkButton>
          <LinkButton href="/account" variant="outline" size="lg">My Account</LinkButton>
        </div>
      </div>
    </div>
  );
}
