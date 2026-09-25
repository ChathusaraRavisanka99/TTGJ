import { Star } from "lucide-react";
import type { ReviewSummary } from "@/lib/reviews";

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} className={rating >= star ? "fill-gold text-gold-deep" : "text-charcoal/20"} />
      ))}
    </span>
  );
}

/** A compact "★★★★☆ 4.2 (8 reviews)" line — shown near the product title
 * when there's at least one approved review, omitted entirely otherwise
 * rather than showing a hollow "0 reviews" line. */
export function RatingSummaryLine({ summary }: { summary: ReviewSummary }) {
  if (summary.count === 0 || summary.average == null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-charcoal/70">
      <StarRow rating={Math.round(summary.average)} />
      {summary.average.toFixed(1)} ({summary.count} review{summary.count === 1 ? "" : "s"})
    </span>
  );
}

/** The full written-reviews list — a separate section further down the
 * product page, only rendered when there's at least one approved review. */
export function ReviewsSection({ summary }: { summary: ReviewSummary }) {
  if (summary.count === 0) return null;
  return (
    <section className="mt-8 rounded-xl border border-border-subtle bg-surface p-5">
      <div className="flex items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">Reviews</p>
        <RatingSummaryLine summary={summary} />
      </div>
      <div className="mt-4 divide-y divide-border-subtle">
        {summary.reviews.map((review) => (
          <div key={review.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <StarRow rating={review.rating} />
              <span className="text-xs text-charcoal/65">{review.createdAt.toLocaleDateString()}</span>
            </div>
            {review.body && <p className="mt-1.5 text-sm leading-relaxed text-charcoal/80">{review.body}</p>}
            <p className="mt-1.5 text-xs text-charcoal/65">{review.reviewerName} · Verified Purchase</p>
          </div>
        ))}
      </div>
    </section>
  );
}
