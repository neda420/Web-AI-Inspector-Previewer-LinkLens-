import { NextRequest, NextResponse } from "next/server";
import { getUrlById, listReviews, saveReview } from "@/lib/store";

export async function GET(req: NextRequest) {
  const urlId = req.nextUrl.searchParams.get("urlId");
  if (!urlId) {
    return NextResponse.json({ error: "urlId is required" }, { status: 400 });
  }

  return NextResponse.json({ reviews: listReviews(urlId) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urlId = typeof body?.urlId === "string" ? body.urlId : "";
    const userName = typeof body?.userName === "string" ? body.userName.trim() : "";
    const rating = Number(body?.rating);
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!urlId || !getUrlById(urlId)) {
      return NextResponse.json({ error: "Valid urlId is required." }, { status: 400 });
    }
    if (!userName) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const review = saveReview({ urlId, userName, rating, text });
    return NextResponse.json(review);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
