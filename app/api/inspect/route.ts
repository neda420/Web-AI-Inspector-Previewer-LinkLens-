import { NextRequest, NextResponse } from "next/server";
import { classifySafety, summarizeWithAI } from "@/lib/ai";
import {
  FALLBACK_COOKIE_TTL_SECONDS,
  MAX_FALLBACK_COOKIE_VALUE_LENGTH,
  MAX_FALLBACK_DESCRIPTION_LENGTH,
  MAX_FALLBACK_REASON_LENGTH,
  MAX_FALLBACK_REASONS,
  MAX_FALLBACK_SUMMARY_LENGTH,
  MAX_FALLBACK_TITLE_LENGTH,
  toBoundedString,
} from "@/lib/fallback-cookie";
import { extractText, fetchPageHtml } from "@/lib/scraper";
import { upsertUrlRecord } from "@/lib/store";
import type { UrlRecord } from "@/lib/types";
import { assertPublicUrl, normalizeUrl } from "@/lib/url";

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
      title: toBoundedString(record.title, MAX_FALLBACK_TITLE_LENGTH),
      description: toBoundedString(record.description, MAX_FALLBACK_DESCRIPTION_LENGTH),
      summary: toBoundedString(record.summary, MAX_FALLBACK_SUMMARY_LENGTH),
      safetyFlags: {
        ...record.safetyFlags,
        reasons: record.safetyFlags.reasons
          .slice(0, MAX_FALLBACK_REASONS)
          .map((reason) => toBoundedString(reason, MAX_FALLBACK_REASON_LENGTH)),
      },
      createdAt: record.createdAt,
    };

    const response = NextResponse.json(record);
    const encodedFallback = encodeURIComponent(JSON.stringify(fallbackRecord));

    if (encodedFallback.length <= MAX_FALLBACK_COOKIE_VALUE_LENGTH) {
      response.cookies.set("linklens_last_result", encodedFallback, {
        path: "/",
        maxAge: FALLBACK_COOKIE_TTL_SECONDS,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to inspect URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
