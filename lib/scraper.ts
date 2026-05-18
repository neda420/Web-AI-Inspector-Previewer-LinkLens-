import * as cheerio from "cheerio";

export const MAX_HTML_BYTES = 1_000_000;
export const FETCH_TIMEOUT_MS = 9_000;
export const MAX_BODY_CHARS = 6_000;

export type ExtractedContent = {
  title: string;
  description: string;
  body: string;
};

export function extractText(html: string): ExtractedContent {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const title = $("title").first().text().trim();
  const description = $("meta[name='description']").attr("content")?.trim() ?? "";
  const body = $("body").text().replace(/\s+/g, " ").trim().slice(0, MAX_BODY_CHARS);

  return { title, description, body };
}

export async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": "LinkLensBot/1.0 (+https://github.com/neda420/Web-AI-Inspector-Previewer-LinkLens)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error("URL is not an HTML page.");
  }

  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error("Page too large to inspect.");
  }

  return html;
}
