import Link from "next/link";
import { getPageContent, DEFAULT_ABOUT_CONTENT } from "@/lib/page-content";
import { AboutBuilder } from "@/components/admin/AboutBuilder";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminAboutContentPage() {
  const content = await getPageContent("about", DEFAULT_ABOUT_CONTENT);

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">About Page Builder</h1>
        <Link href="/about" target="_blank" className="text-sm text-gold underline">
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Add, remove, and drag to reorder blocks. The panel on the right updates live as you edit — nothing changes on
        the real page until you press Save.
      </p>

      <div className="mt-6">
        <AboutBuilder initialBlocks={content.blocks} />
      </div>
    </div>
  );
}
