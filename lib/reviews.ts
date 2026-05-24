import type { Review } from "@/lib/types";

export function computeAverageRating(reviews: Pick<Review, "rating">[]): number {
  if (!reviews.length) return 0;
  return Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2));
}
