import Link from "next/link";
import { TrustBar } from "./TrustBar";
import type { FooterMessages, TrustBarMessages } from "@/lib/i18n-messages";

// Both message bundles come in as plain props, pre-resolved server-side in
// RootLayout — see src/lib/i18n-messages.ts for why Footer (rendered from
// SiteChrome, a Client Component) can't call getTranslations itself.
export function Footer({ messages, trustBarMessages }: { messages: FooterMessages; trustBarMessages: TrustBarMessages }) {
  return (
    <footer className="border-t border-border-subtle bg-ivory-soft">
      <div className="mx-auto max-w-[120rem] px-5 py-14 sm:px-8 lg:px-12 xl:px-16">
        <TrustBar messages={trustBarMessages} className="border-b border-border-subtle pb-12" />
        <div className="mt-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-serif text-xl text-charcoal">Ratnavue</p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/65">{messages.tagline}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">{messages.explore}</p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal/70">
              <li><Link href="/gems" className="hover:text-charcoal">{messages.gemstones}</Link></li>
              <li><Link href="/jewelry" className="hover:text-charcoal">{messages.jewelry}</Link></li>
              <li><Link href="/configurator" className="hover:text-charcoal">{messages.designYourGem}</Link></li>
              <li><Link href="/sourcing" className="hover:text-charcoal">{messages.gemSourcing}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">{messages.company}</p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal/70">
              <li><Link href="/about" className="hover:text-charcoal">{messages.ourStory}</Link></li>
              <li><Link href="/account" className="hover:text-charcoal">{messages.myAccount}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">{messages.pricingNoteTitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/65">{messages.pricingNoteBody}</p>
          </div>
        </div>
        <p className="mt-12 text-xs text-charcoal/40">{messages.rights}</p>
      </div>
    </footer>
  );
}
