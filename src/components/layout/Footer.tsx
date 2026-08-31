import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-ivory-soft">
      <div className="mx-auto max-w-[90rem] px-5 py-14 sm:px-8 lg:px-12">
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
              Every piece is individually quoted by our gemologists. Browse freely, then request a quote —
              no prices are listed on the site.
            </p>
          </div>
        </div>
        <p className="mt-12 text-xs text-charcoal/40">© {new Date().getFullYear()} Ratnavue. All rights reserved.</p>
      </div>
    </footer>
  );
}
