import { Cinzel, Bebas_Neue, Courier_Prime } from "next/font/google";

// Extra display faces used only by a couple of the five subculture themes
// (see headingFontVar in src/lib/subculture-collections.ts) — scoped to
// this route group via next/font/google's CSS variables so no other page
// on the site pays for their download.
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "600"] });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400" });
const courierPrime = Courier_Prime({ variable: "--font-courier-prime", subsets: ["latin"], weight: "400" });

export default function CollectionsLayout({ children }: LayoutProps<"/collections">) {
  return <div className={`${cinzel.variable} ${bebas.variable} ${courierPrime.variable}`}>{children}</div>;
}
