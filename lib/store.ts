import { getSupabase } from "@/lib/supabase";
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
  const { data, error } = await getSupabase().from("url_records").select().eq("id", id).single();
  if (error || !data) return null;
  return rowToUrlRecord(data);
}

export async function listReviews(urlId: string): Promise<Review[]> {
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
