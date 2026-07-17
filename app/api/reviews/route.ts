import { NextRequest, NextResponse } from "next/server";
import {
  FALLBACK_COOKIE_TTL_SECONDS,
} from "@/lib/fallback-cookie";
import { hasSupabaseConfig } from "@/lib/supabase";
import { getUrlById, listReviews, saveReview } from "@/lib/store";
import { randomUUID } from "node:crypto";

const REVIEWER_COOKIE_NAME = "linklens_reviewer_id";
const REVIEWER_COOKIE_PATTERN = /^anon_[a-f0-9]{12}$/;

function createAnonymousReviewerId() {
  return `anon_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function getAnonymousReviewerId(req: NextRequest) {
  const cookieValue = req.cookies.get(REVIEWER_COOKIE_NAME)?.value;
  if (cookieValue && REVIEWER_COOKIE_PATTERN.test(cookieValue)) {
    return { reviewerId: cookieValue, shouldSetCookie: false };
  }
  return { reviewerId: createAnonymousReviewerId(), shouldSetCookie: true };
}

export async function GET(req: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Community reviews are unavailable until Supabase is configured." }, { status: 503 });
  }

  const urlId = req.nextUrl.searchParams.get("urlId");
  if (!urlId) {
    return NextResponse.json({ error: "urlId is required" }, { status: 400 });
  }

  return NextResponse.json({ reviews: await listReviews(urlId) });
}

export async function POST(req: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Community reviews are unavailable until Supabase is configured." }, { status: 503 });
    }

    const body = await req.json();
    const urlId = typeof body?.urlId === "string" ? body.urlId : "";
    const rating = Number(body?.rating);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    if (!urlId || !(await getUrlById(urlId))) {
      return NextResponse.json({ error: "Valid urlId is required." }, { status: 400 });
    }

    const { reviewerId, shouldSetCookie } = getAnonymousReviewerId(req);
    const review = await saveReview({ urlId, userName: reviewerId, rating, text });
    const response = NextResponse.json(review);

    if (shouldSetCookie) {
      response.cookies.set(REVIEWER_COOKIE_NAME, reviewerId, {
        path: "/",
        maxAge: FALLBACK_COOKIE_TTL_SECONDS,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
