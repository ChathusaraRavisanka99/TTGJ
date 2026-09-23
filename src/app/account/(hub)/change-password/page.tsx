import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/quote/ChangePasswordForm";

export const metadata: Metadata = { title: "Change Password" };

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) return null; // proxy.ts guards this route

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { mustChangePassword: true } });

  return (
    <div className="w-full">
      <p className="text-xs uppercase tracking-widest text-gold-deep">Account</p>
      <h1 className="mt-2 font-serif text-3xl text-charcoal">Change Password</h1>
      {user?.mustChangePassword && (
        <p className="mt-2 max-w-md text-sm text-amber-800">
          Your account was set up with a temporary password — please choose a new one below.
        </p>
      )}
      <div className="mt-8">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
