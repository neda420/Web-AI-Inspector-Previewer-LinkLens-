import type { Review } from "@/lib/types";

type ReviewTimelineProps = {
  reviews: Review[];
};

export function ReviewTimeline({ reviews }: ReviewTimelineProps) {
  if (!reviews.length) {
    return <p className="text-sm text-slate-400">No reviews yet. Be the first to rate this link.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-slate-100">{review.userName}</p>
            <p className="text-sm text-amber-300">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
          </div>
          {review.text ? <p className="mt-2 text-sm text-slate-300">{review.text}</p> : null}
          <p className="mt-2 text-xs text-slate-500">{new Date(review.createdAt).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}
