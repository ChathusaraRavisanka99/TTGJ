import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPageVisibilities } from "@/lib/page-visibility";
import { getSeasonalContent } from "@/lib/page-content";
import { SEASONAL_THEMES } from "@/lib/seasonal-themes";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { MainWrapper } from "@/components/layout/MainWrapper";
import { getFooterMessages, getTrustBarMessages } from "@/lib/i18n-messages";
import type { AppLocale } from "@/i18n/request";

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
  const [session, visibilities, seasonalContent, locale] = await Promise.all([
    auth(),
    getPageVisibilities(["seasonal", "auction"]),
    getSeasonalContent(),
    getLocale(),
  ]);
  // Navbar's transparent-over-hero treatment on /promotions is only safe
  // when that season's hero is actually dark (Halloween) — Spring/Summer/
  // Autumn/Winter's are light, where transparent ivory nav text would go
  // illegible. Computed here (cheap, and this already fetches session/
  // visibility fresh on every navigation) rather than Navbar querying it
  // itself, same "compute where it's cheap" reasoning as cartItemCount.
  const promotionsThemeIsDark = SEASONAL_THEMES[seasonalContent.activeTheme]?.isDark ?? false;
  // Computed once here (a Server Component, so this only ever runs on the
  // server) and threaded down through SiteChrome to Footer as plain
  // prop values — see src/lib/i18n-messages.ts for why Footer can't
  // resolve its own translations.
  const [footerMessages, trustBarMessages] = await Promise.all([
    getFooterMessages(new Date().getFullYear()),
    getTrustBarMessages(),
  ]);
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
    <html lang={locale} className={`${cormorant.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory text-charcoal">
        <NextIntlClientProvider>
          <SiteChrome
            user={session?.user ?? null}
            footerMessages={footerMessages}
            trustBarMessages={trustBarMessages}
            showPromotions={visibilities.seasonal !== "HIDDEN"}
            showAuction={visibilities.auction !== "HIDDEN"}
            cartItemCount={cartItemCount}
            promotionsThemeIsDark={promotionsThemeIsDark}
            locale={locale as AppLocale}
          >
            <MainWrapper>{children}</MainWrapper>
          </SiteChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
