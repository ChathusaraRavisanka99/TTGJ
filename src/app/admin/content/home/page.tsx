import Link from "next/link";
import { getHomeContent } from "@/lib/page-content";
import { setHomeImage } from "@/actions/page-content";
import { HomeContentForm } from "@/components/admin/HomeContentForm";
import { HeroSlidesManager } from "@/components/admin/HeroSlidesManager";
import { ContentImageField } from "@/components/admin/ContentImageField";
import { BackLink } from "@/components/admin/BackLink";
import { MarketTabs, parseAdminMarket } from "@/components/admin/MarketTabs";

export default async function AdminHomeContentPage({ searchParams }: PageProps<"/admin/content/home">) {
  const market = parseAdminMarket((await searchParams).market);
  const content = await getHomeContent(market);

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Home Page Content</h1>
        <Link href={market === "lk" ? "/lk" : "/"} target="_blank" className="text-sm text-gold underline">
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Edit the hero slideshow, banner images, and marketing copy shown on the home page. Which gemstones and
        jewelry are featured is picked from their own catalog pages, not here — this page only switches those two
        sections on or off (under Text → Sections, below).
      </p>

      <MarketTabs basePath="/admin/content/home" current={market} />
      {market === "lk" && (
        <p className="mt-3 text-sm text-charcoal/60">
          Editing the <strong>Sri Lanka store</strong> home page (/lk). Featured items are picked with the LK★ star on
          the Gemstones and Jewelry lists. Until you save changes here it shows the Sri Lanka defaults.
        </p>
      )}

      <div className="mt-8 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Hero Slideshow</p>
        <div className="mt-4">
          <HeroSlidesManager slides={content.heroSlides} market={market} />
        </div>
      </div>

      <div className="mt-10 grid gap-8 border-t border-border-subtle pt-8 sm:grid-cols-2">
        <ContentImageField
          label="Heritage banner image"
          currentSrc={content.heritageImage}
          action={setHomeImage.bind(null, market, "heritageImage")}
        />
        <ContentImageField
          label="Sourcing banner image"
          currentSrc={content.sourcingImage}
          action={setHomeImage.bind(null, market, "sourcingImage")}
        />
      </div>

      <div className="mt-10 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Text</p>
        <div className="mt-4">
          <HomeContentForm key={market} initial={content} market={market} />
        </div>
      </div>
    </div>
  );
}
