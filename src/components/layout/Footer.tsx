import Link from "next/link";

// `year` comes in as a prop computed once on the server (see RootLayout),
// rather than calling `new Date().getFullYear()` here — Footer has no "use
// client" of its own, but it's imported and rendered directly by
// SiteChrome, which does, so its code ships to and re-runs on the client
// during hydration. Computing the year there risked React's hydration
// diff genuinely disagreeing with the server's render (different
// timezones, or a request landing right on a New Year's boundary) and
// throwing the "server/client text didn't match" warning on this exact
// line. A plain number prop can't disagree with itself.
export function Footer({ year }: { year: number }) {
  return (
    <footer className="border-t border-border-subtle bg-ivory-soft">
      <div className="mx-auto max-w-[120rem] px-5 py-14 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-serif text-xl text-charcoal">Ratnavue</p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
              Ceylon gemstones and fine jewelry, sourced and quoted with care from Sri Lanka.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal/70">
              <li><Link href="/gems" className="hover:text-charcoal">Gemstones</Link></li>
              <li><Link href="/jewelry" className="hover:text-charcoal">Jewelry</Link></li>
              <li><Link href="/configurator" className="hover:text-charcoal">Design Your Gem</Link></li>
              <li><Link href="/sourcing" className="hover:text-charcoal">Gem Sourcing</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal/70">
              <li><Link href="/about" className="hover:text-charcoal">Our Story</Link></li>
              <li><Link href="/account" className="hover:text-charcoal">My Account</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">A note on pricing</p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
              Every piece is individually assessed by our gemologists. Where a price is shown, it&apos;s listed
              directly — otherwise, browse freely and request a quote.
            </p>
          </div>
        </div>
        <p className="mt-12 text-xs text-charcoal/40">© {year} Ratnavue. All rights reserved.</p>
      </div>
    </footer>
  );
}
