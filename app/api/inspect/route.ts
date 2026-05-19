import { NextRequest, NextResponse } from "next/server";
import { classifySafety, summarizeWithAI } from "@/lib/ai";
import { extractText, fetchPageHtml } from "@/lib/scraper";
import { upsertUrlRecord } from "@/lib/store";
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

    return NextResponse.json(record);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to inspect URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
