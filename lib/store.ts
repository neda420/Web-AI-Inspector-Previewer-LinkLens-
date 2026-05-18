import crypto from "node:crypto";
import { computeTrustScore } from "@/lib/trust-score";
import type { Review, UrlRecord, UrlWithScores } from "@/lib/types";

const urlsById = new Map<string, UrlRecord>();
const urlIdByNormalized = new Map<string, string>();
const reviewsByUrlId = new Map<string, Review[]>();

export function upsertUrlRecord(input: Omit<UrlRecord, "id" | "createdAt">): UrlRecord {
  const existingId = urlIdByNormalized.get(input.normalizedUrl);
  if (existingId) {
    const current = urlsById.get(existingId);
    if (current) {
      const updated: UrlRecord = { ...current, ...input };
      urlsById.set(existingId, updated);
      return updated;
    }
  }

  const created: UrlRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  urlsById.set(created.id, created);
  urlIdByNormalized.set(created.normalizedUrl, created.id);
  return created;
}

export function getUrlById(id: string): UrlRecord | null {
  return urlsById.get(id) ?? null;
}

export function listReviews(urlId: string): Review[] {
  return [...(reviewsByUrlId.get(urlId) ?? [])].reverse();
}

export function saveReview(input: { urlId: string; userName: string; rating: number; text: string }): Review {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const existing = reviewsByUrlId.get(input.urlId) ?? [];
  const now = new Date().toISOString();
  const sameUserIndex = existing.findIndex((r) => r.userName.toLowerCase() === input.userName.toLowerCase());

  if (sameUserIndex >= 0) {
    const current = existing[sameUserIndex];
    const updated: Review = {
      ...current,
      rating: input.rating,
      text: input.text,
      updatedAt: now,
    };
    existing[sameUserIndex] = updated;
    reviewsByUrlId.set(input.urlId, existing);
    return updated;
  }

  const review: Review = {
    id: crypto.randomUUID(),
    urlId: input.urlId,
    userName: input.userName,
    rating: input.rating,
    text: input.text,
    createdAt: now,
    updatedAt: now,
  };

  existing.push(review);
  reviewsByUrlId.set(input.urlId, existing);
  return review;
}

export function getUrlWithScores(urlId: string): UrlWithScores | null {
  const url = getUrlById(urlId);
  if (!url) return null;

  const reviews = listReviews(urlId);
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(2))
    : 0;

  return {
    ...url,
    reviews,
    reviewCount,
    averageRating,
    trustScore: computeTrustScore(averageRating, url.safetyFlags),
  };
}
