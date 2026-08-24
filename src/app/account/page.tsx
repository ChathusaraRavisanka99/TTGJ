import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware guards this route

  const [quoteCount, sourcingCount] = await Promise.all([
    prisma.quoteRequest.count({ where: { userId: session.user.id } }),
    prisma.sourcingRequest.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Account</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">Welcome back, {session.user.name?.split(" ")[0] ?? "there"}</h1>
      <p className="mt-2 text-sm text-charcoal/60">{session.user.email}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/account/quotes" className="rounded-xl border border-border-subtle bg-surface p-6 hover:border-gold">
          <p className="font-serif text-2xl text-charcoal">{quoteCount}</p>
          <p className="mt-1 text-sm text-charcoal/60">Quote requests</p>
        </Link>
        <Link href="/account/sourcing" className="rounded-xl border border-border-subtle bg-surface p-6 hover:border-gold">
          <p className="font-serif text-2xl text-charcoal">{sourcingCount}</p>
          <p className="mt-1 text-sm text-charcoal/60">Sourcing requests</p>
        </Link>
      </div>

      <form action={signOutAction} className="mt-10">
        <Button type="submit" variant="outline">Sign Out</Button>
      </form>
    </div>
  );
}
