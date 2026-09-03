import Link from "next/link";
import { getPageContent, DEFAULT_ABOUT_CONTENT } from "@/lib/page-content";
import { setAboutImage } from "@/actions/page-content";
import { AboutContentForm } from "@/components/admin/AboutContentForm";
import { ContentImageField } from "@/components/admin/ContentImageField";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminAboutContentPage() {
  const content = await getPageContent("about", DEFAULT_ABOUT_CONTENT);

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">About Page Content</h1>
        <Link href="/about" target="_blank" className="text-sm text-gold underline">
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">Edit the images and copy shown on the Our Story page.</p>

      <div className="mt-8 grid gap-8 border-t border-border-subtle pt-8 sm:grid-cols-2">
        <ContentImageField
          label="Hero banner image"
          currentSrc={content.heroImage}
          action={setAboutImage.bind(null, "heroImage")}
        />
        <ContentImageField
          label="Image break photo"
          currentSrc={content.breakImage}
          action={setAboutImage.bind(null, "breakImage")}
        />
      </div>

      <div className="mt-10 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Text</p>
        <div className="mt-4">
          <AboutContentForm initial={content} />
        </div>
      </div>
    </div>
  );
}
