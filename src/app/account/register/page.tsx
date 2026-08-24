import type { Metadata } from "next";
import { RegisterForm } from "@/components/quote/RegisterForm";

export const metadata: Metadata = { title: "Create Account" };

export default async function RegisterPage({ searchParams }: PageProps<"/account/register">) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/account";

  return (
    <div className="mx-auto max-w-md px-5 py-20 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Account</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">Create Your Account</h1>
      <p className="mt-3 text-sm text-charcoal/65">Register to request quotes, submit sourcing requests, and track their status.</p>
      <div className="mt-8">
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
