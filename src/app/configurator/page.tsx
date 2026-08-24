import type { Metadata } from "next";
import { getMasterData } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { GemConfiguratorClient } from "@/components/configurator/GemConfiguratorClient";

export const metadata: Metadata = {
  title: "Design Your Gem",
  description: "Configure a Ceylon gemstone by mineral, cut, carat weight, colour, tone, and clarity, then request a quote.",
};

export default async function ConfiguratorPage() {
  const [masterData, session] = await Promise.all([getMasterData(), auth()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-gold">Design Your Gem</p>
        <h1 className="mt-2 font-serif text-4xl text-charcoal">Configure your own Ceylon gemstone</h1>
        <p className="mt-3 text-charcoal/65">
          Choose a mineral, cut, size, colour, tone, and clarity to see an illustrative rendering update live.
          When you&apos;re happy with the spec, request a quote and our gemologists will source or match it for you.
        </p>
      </div>

      <GemConfiguratorClient
        minerals={masterData.minerals}
        cuts={masterData.cuts}
        clarityGrades={masterData.clarityGrades}
        isAuthenticated={!!session?.user}
      />
    </div>
  );
}
