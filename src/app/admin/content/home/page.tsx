import Link from "next/link";
import { getPageContent, DEFAULT_HOME_CONTENT } from "@/lib/page-content";
import { setHomeImage } from "@/actions/page-content";
import { HomeContentForm } from "@/components/admin/HomeContentForm";
import { HeroSlidesManager } from "@/components/admin/HeroSlidesManager";
import { ContentImageField } from "@/components/admin/ContentImageField";

export default async function AdminHomeContentPage() {
  const content = await getPageContent("home", DEFAULT_HOME_CONTENT);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Home Page Content</h1>
        <Link href="/" target="_blank" className="text-sm text-gold underline">
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Edit the hero slideshow, banner images, and marketing copy shown on the home page. Featured gemstones come
        from the catalog and aren&apos;t edited here.
      </p>

      <div className="mt-8 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Hero Slideshow</p>
        <div className="mt-4">
          <HeroSlidesManager slides={content.heroSlides} />
        </div>
      </div>

      <div className="mt-10 grid gap-8 border-t border-border-subtle pt-8 sm:grid-cols-2">
        <ContentImageField
          label="Heritage banner image"
          currentSrc={content.heritageImage}
          action={setHomeImage.bind(null, "heritageImage")}
        />
        <ContentImageField
          label="Sourcing banner image"
          currentSrc={content.sourcingImage}
          action={setHomeImage.bind(null, "sourcingImage")}
        />
      </div>

      <div className="mt-10 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Text</p>
        <div className="mt-4">
          <HomeContentForm initial={content} />
        </div>
      </div>
    </div>
  );
}
