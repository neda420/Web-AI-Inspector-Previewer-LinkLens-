import { NextRequest, NextResponse } from "next/server";
import { classifySafety, summarizeWithAI } from "@/lib/ai";
import { extractText, fetchPageHtml } from "@/lib/scraper";
import { upsertUrlRecord } from "@/lib/store";
import type { UrlRecord } from "@/lib/types";
import { assertPublicUrl, normalizeUrl } from "@/lib/url";

// Keep fallback data short-lived to reduce stale results exposure.
const FALLBACK_COOKIE_TTL_SECONDS = 10 * 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url : "";

    if (!rawUrl.trim()) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(rawUrl);
    await assertPublicUrl(normalizedUrl);

    const html = await fetchPageHtml(normalizedUrl);
    const extracted = extractText(html);
    const summary = await summarizeWithAI(extracted);
    const safetyFlags = classifySafety(extracted);

    const record = await upsertUrlRecord({
      normalizedUrl,
      title: extracted.title,
      description: extracted.description,
      summary,
      safetyFlags,
    });

    const fallbackRecord: UrlRecord = {
      id: record.id,
      normalizedUrl: record.normalizedUrl,
      title: record.title,
      description: record.description,
      summary: record.summary,
      safetyFlags: record.safetyFlags,
      createdAt: record.createdAt,
    };

    const response = NextResponse.json(record);
    response.cookies.set("linklens_last_result", encodeURIComponent(JSON.stringify(fallbackRecord)), {
      path: "/",
      maxAge: FALLBACK_COOKIE_TTL_SECONDS,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to inspect URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
