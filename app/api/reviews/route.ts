import { NextRequest, NextResponse } from "next/server";
import {
  FALLBACK_REVIEW_COOKIE_PREFIX,
  FALLBACK_COOKIE_TTL_SECONDS,
  MAX_FALLBACK_COOKIE_VALUE_LENGTH,
  MAX_FALLBACK_REVIEW_NAME_LENGTH,
  MAX_FALLBACK_REVIEW_TEXT_LENGTH,
  MAX_FALLBACK_REVIEWS,
  toBoundedString,
} from "@/lib/fallback-cookie";
import { hasSupabaseConfig } from "@/lib/supabase";
import { getUrlById, listReviews, saveReview } from "@/lib/store";
import type { Review } from "@/lib/types";

function toFallbackReview(review: Review): Review {
  return {
    ...review,
    userName: toBoundedString(review.userName, MAX_FALLBACK_REVIEW_NAME_LENGTH),
    text: toBoundedString(review.text ?? "", MAX_FALLBACK_REVIEW_TEXT_LENGTH),
  };
}

export async function GET(req: NextRequest) {
  const urlId = req.nextUrl.searchParams.get("urlId");
  if (!urlId) {
    return NextResponse.json({ error: "urlId is required" }, { status: 400 });
  }

  return NextResponse.json({ reviews: await listReviews(urlId) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urlId = typeof body?.urlId === "string" ? body.urlId : "";
    const userName = typeof body?.userName === "string" ? body.userName.trim() : "";
    const rating = Number(body?.rating);
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!userName) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const hasDb = hasSupabaseConfig();
    if (!urlId || (hasDb && !(await getUrlById(urlId)))) {
      return NextResponse.json({ error: "Valid urlId is required." }, { status: 400 });
    }

    const review = await saveReview({ urlId, userName, rating, text });
    const response = NextResponse.json(review);

    if (!hasDb) {
      const reviews = (await listReviews(urlId)).slice(0, MAX_FALLBACK_REVIEWS).map(toFallbackReview);
      const encoded = encodeURIComponent(JSON.stringify(reviews));
      if (encoded.length <= MAX_FALLBACK_COOKIE_VALUE_LENGTH) {
        response.cookies.set(`${FALLBACK_REVIEW_COOKIE_PREFIX}${urlId}`, encoded, {
          path: "/",
          maxAge: FALLBACK_COOKIE_TTL_SECONDS,
          sameSite: "lax",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
