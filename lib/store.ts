import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { computeTrustScore } from "@/lib/trust-score";
import type { Review, SafetyFlags, UrlRecord, UrlWithScores } from "@/lib/types";

interface UrlRecordRow {
  id: string;
  normalized_url: string;
  title: string | null;
  description: string | null;
  summary: string | null;
  safety_flags: SafetyFlags | null;
  created_at: string;
}

interface ReviewRow {
  id: string;
  url_id: string;
  user_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}

const memoryUrlRecordsById = new Map<string, UrlRecord>();
const memoryUrlIdByNormalized = new Map<string, string>();
const memoryReviewsByUrlId = new Map<string, Map<string, Review>>();
const MAX_MEMORY_URL_RECORDS = 200;
const MAX_MEMORY_REVIEWS_PER_URL = 200;

function trimMemoryUrlRecords() {
  while (memoryUrlRecordsById.size > MAX_MEMORY_URL_RECORDS) {
    const oldestId = memoryUrlRecordsById.keys().next().value;
    if (!oldestId) break;
    const oldest = memoryUrlRecordsById.get(oldestId);
    memoryUrlRecordsById.delete(oldestId);
    if (oldest) {
      memoryUrlIdByNormalized.delete(oldest.normalizedUrl);
    }
    memoryReviewsByUrlId.delete(oldestId);
  }
}

function trimMemoryReviews(urlId: string, reviews: Map<string, Review>) {
  while (reviews.size > MAX_MEMORY_REVIEWS_PER_URL) {
    const oldestUser = reviews.keys().next().value;
    if (!oldestUser) break;
    reviews.delete(oldestUser);
  }
  memoryReviewsByUrlId.set(urlId, reviews);
}

function rowToUrlRecord(row: UrlRecordRow): UrlRecord {
  return {
    id: row.id,
    normalizedUrl: row.normalized_url,
    title: row.title ?? "",
    description: row.description ?? "",
    summary: row.summary ?? "",
    safetyFlags: row.safety_flags ?? { risk: "safe", reasons: [] },
    createdAt: row.created_at,
  };
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    urlId: row.url_id,
    userName: row.user_name,
    rating: row.rating,
    text: row.review_text ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertUrlRecord(input: Omit<UrlRecord, "id" | "createdAt">): Promise<UrlRecord> {
  if (!hasSupabaseConfig()) {
    const now = new Date().toISOString();
    const existingId = memoryUrlIdByNormalized.get(input.normalizedUrl);

    if (existingId) {
      const existing = memoryUrlRecordsById.get(existingId);
      if (existing) {
        const updated: UrlRecord = {
          ...existing,
          normalizedUrl: input.normalizedUrl,
          title: input.title,
          description: input.description,
          summary: input.summary,
          safetyFlags: input.safetyFlags,
        };
        memoryUrlRecordsById.delete(existingId);
        memoryUrlRecordsById.set(existingId, updated);
        return updated;
      }
    }

    const id = crypto.randomUUID();
    const created: UrlRecord = {
      id,
      normalizedUrl: input.normalizedUrl,
      title: input.title,
      description: input.description,
      summary: input.summary,
      safetyFlags: input.safetyFlags,
      createdAt: now,
    };

    memoryUrlRecordsById.set(id, created);
    memoryUrlIdByNormalized.set(input.normalizedUrl, id);
    trimMemoryUrlRecords();
    return created;
  }

  const { data, error } = await getSupabase()
    .from("url_records")
    .upsert(
      {
        normalized_url: input.normalizedUrl,
        title: input.title,
        description: input.description,
        summary: input.summary,
        safety_flags: input.safetyFlags,
      },
      { onConflict: "normalized_url" },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToUrlRecord(data);
}

export async function getUrlById(id: string): Promise<UrlRecord | null> {
  if (!hasSupabaseConfig()) {
    return memoryUrlRecordsById.get(id) ?? null;
  }

  const { data, error } = await getSupabase().from("url_records").select().eq("id", id).single();
  if (error || !data) return null;
  return rowToUrlRecord(data);
}

export async function listReviews(urlId: string): Promise<Review[]> {
  if (!hasSupabaseConfig()) {
    const reviewsForUrl = memoryReviewsByUrlId.get(urlId);
    if (!reviewsForUrl) return [];
    return Array.from(reviewsForUrl.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const { data, error } = await getSupabase()
    .from("url_reviews")
    .select()
    .eq("url_id", urlId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToReview);
}

export async function saveReview(input: {
  urlId: string;
  userName: string;
  rating: number;
  text: string;
}): Promise<Review> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  if (!hasSupabaseConfig()) {
    const now = new Date().toISOString();
    const urlReviews = memoryReviewsByUrlId.get(input.urlId) ?? new Map<string, Review>();
    const existing = urlReviews.get(input.userName);

    const review: Review = existing
      ? {
          ...existing,
          rating: input.rating,
          text: input.text,
          updatedAt: now,
        }
      : {
          id: crypto.randomUUID(),
          urlId: input.urlId,
          userName: input.userName,
          rating: input.rating,
          text: input.text,
          createdAt: now,
          updatedAt: now,
        };

    if (existing) {
      urlReviews.delete(input.userName);
    }
    urlReviews.set(input.userName, review);
    trimMemoryReviews(input.urlId, urlReviews);
    return review;
  }

  const { data, error } = await getSupabase()
    .from("url_reviews")
    .upsert(
      {
        url_id: input.urlId,
        user_name: input.userName,
        rating: input.rating,
        review_text: input.text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "url_id,user_name" },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToReview(data);
}

export async function getUrlWithScores(urlId: string): Promise<UrlWithScores | null> {
  const url = await getUrlById(urlId);
  if (!url) return null;

  const reviews = await listReviews(urlId);
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
