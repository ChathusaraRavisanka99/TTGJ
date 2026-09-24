import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Account disabled", robots: { index: false } };

export default function AccountDisabledPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-charcoal">This account is disabled</h1>
      <p className="mt-3 text-sm text-charcoal/70">
        Your account has been switched off, so you can&apos;t use it right now. If you think this is a mistake, or you&apos;d
        like it reviewed, please contact us.
      </p>
      <form action={signOutAction} className="mt-6">
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </div>
  );
}
