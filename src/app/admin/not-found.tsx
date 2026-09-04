import { GemMinerScene } from "@/components/illustrations/GemMinerScene";
import { BackLink } from "@/components/admin/BackLink";
import { LinkButton } from "@/components/ui/Button";

// Scoped to /admin so a notFound() thrown by any admin detail page (see
// its [id]/page.tsx files) renders inside the admin shell — sidebar
// included — instead of falling through to the root not-found.tsx, which
// would swap in the public Navbar/Footer around it and look like a
// broken/logged-out state to an admin who very much is signed in.
export default function AdminNotFound() {
  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex min-h-[50vh] items-center justify-center px-5 py-12 text-center">
        <div className="mx-auto max-w-md">
          <GemMinerScene className="mx-auto h-36 w-auto" />
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-gold">404</p>
          <h1 className="mt-2 font-serif text-2xl text-charcoal">Not in this catalog.</h1>
          <p className="mt-3 text-sm text-charcoal/70">
            Whatever you were looking for isn&apos;t here — it may have been deleted, or the link is out of date.
          </p>
          <div className="mt-6 flex justify-center">
            <LinkButton href="/admin" variant="gold">Back to Dashboard</LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
