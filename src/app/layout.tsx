import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPageVisibilities } from "@/lib/page-visibility";
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
  const [session, visibilities] = await Promise.all([auth(), getPageVisibilities(["seasonal", "auction"])]);
  // Computed once here (a Server Component, so this only ever runs on the
  // server) and threaded down through SiteChrome to Footer as a plain
  // prop — see Footer.tsx for why Footer can't just compute this itself.
  const year = new Date().getFullYear();
  // Same reasoning for the nav's cart badge — cheap enough to read fresh
  // on every navigation rather than push it into the session/JWT. Summed
  // quantity, not a row count, to match the cart page's own "N items"
  // wording (retailCartSubtotal's sibling reduce in lib/retail-cart.ts).
  const cartItemCount = session?.user
    ? (await prisma.retailCartItem.aggregate({
        where: { cart: { userId: session.user.id } },
        _sum: { quantity: true },
      }))._sum.quantity ?? 0
    : 0;

  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory text-charcoal">
        <SiteChrome
          user={session?.user ?? null}
          year={year}
          showPromotions={visibilities.seasonal !== "HIDDEN"}
          showAuction={visibilities.auction !== "HIDDEN"}
          cartItemCount={cartItemCount}
        >
          <MainWrapper>{children}</MainWrapper>
        </SiteChrome>
      </body>
    </html>
  );
}
