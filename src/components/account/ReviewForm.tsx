"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/actions/reviews";
import { Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

/** Inline "Leave a Review" prompt for one purchased item — same expand-to-
 * form pattern as RefundRequestForm. Only ever rendered for an item
 * lib/reviews.ts's getReviewableItems already confirmed this customer
 * bought and hasn't reviewed yet; submitReview re-verifies that live
 * anyway, so this is a UX convenience, not the actual gate. */
export function ReviewForm({ gemstoneId, jewelryId, itemName }: { gemstoneId?: string; jewelryId?: string; itemName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    formData.set("rating", String(rating));
    setPending(true);
    try {
      const result = await submitReviewAction({ gemstoneId, jewelryId }, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (submitted) return <p className="text-xs text-green-700">Thanks — your review is awaiting approval.</p>;

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Leave a Review
      </Button>
    );
  }

  const fieldId = `review-body-${gemstoneId ?? jewelryId}`;

  return (
    <form action={handleSubmit} className="mt-2 space-y-3 rounded-lg border border-border-subtle bg-ivory-soft p-3">
      <div>
        <Label>Your rating for {itemName}</Label>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
            >
              <Star size={20} className={(hoverRating || rating) >= star ? "fill-gold text-gold-deep" : "text-charcoal/25"} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor={fieldId}>Your review (optional)</Label>
        <Textarea id={fieldId} name="body" placeholder="What stood out about this piece?" />
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <div className="flex gap-2">
        <Button type="submit" variant="gold" size="sm" disabled={pending}>
          {pending ? "Submitting..." : "Submit Review"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
