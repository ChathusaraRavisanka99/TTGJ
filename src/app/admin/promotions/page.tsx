import Link from "next/link";
import { getPageContent, DEFAULT_SEASONAL_CONTENT } from "@/lib/page-content";
import { getPageVisibility } from "@/lib/page-visibility";
import { SeasonalContentForm } from "@/components/admin/SeasonalContentForm";
import { PageVisibilityControl } from "@/components/admin/PageVisibilityControl";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminPromotionsPage() {
  const [content, visibility] = await Promise.all([
    getPageContent("seasonal", DEFAULT_SEASONAL_CONTENT),
    getPageVisibility("seasonal"),
  ]);

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Seasonal Promotions</h1>
        <Link href="/promotions" target="_blank" className="text-sm text-gold underline">
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        A single themed page at /promotions — pick a season, write the copy, and switch it Hidden, Coming Soon, or
        Live. Nothing here appears anywhere else on the site (no nav link) unless it&apos;s Coming Soon or Live.
      </p>

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5">
        <PageVisibilityControl pageKey="seasonal" currentState={visibility} />
      </div>

      <div className="mt-8 border-t border-border-subtle pt-8">
        <p className="font-serif text-xl text-charcoal">Theme &amp; Copy</p>
        <div className="mt-4">
          <SeasonalContentForm initial={content} />
        </div>
      </div>
    </div>
  );
}
