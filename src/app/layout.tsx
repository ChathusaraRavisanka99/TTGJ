import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { getPageVisibility } from "@/lib/page-visibility";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { MainWrapper } from "@/components/layout/MainWrapper";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ratnavue — Ceylon Gemstones & Jewelry",
    template: "%s · Ratnavue",
  },
  description:
    "Ratnavue is a Ceylon gemstone and jewelry house offering ethically sourced sapphires, rubies, and fine jewelry, with bespoke gem sourcing and quotation.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session, seasonalVisibility] = await Promise.all([auth(), getPageVisibility("seasonal")]);
  // Computed once here (a Server Component, so this only ever runs on the
  // server) and threaded down through SiteChrome to Footer as a plain
  // prop — see Footer.tsx for why Footer can't just compute this itself.
  const year = new Date().getFullYear();

  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory text-charcoal">
        <SiteChrome user={session?.user ?? null} year={year} showPromotions={seasonalVisibility !== "HIDDEN"}>
          <MainWrapper>{children}</MainWrapper>
        </SiteChrome>
      </body>
    </html>
  );
}
