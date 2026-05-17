# LinkLens (Web AI Inspector & Previewer)

LinkLens helps users understand what a URL is before committing time or trust.

## 1) Product Architecture

### Recommended stack (rapid MVP -> scalable)
- **Frontend/App:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Auth/DB/Storage:** Supabase (Postgres + Auth + RLS)
- **AI + summarization:** OpenAI (GPT-4.1/4o-mini) or Anthropic Claude via server-side API route
- **Scraping/extraction:** `fetch` + `cheerio` + metadata extraction (server-only)
- **Background jobs (optional):** Upstash QStash / Supabase Edge Functions / Vercel Cron
- **Hosting:** Vercel
- **Monitoring:** Sentry + PostHog

### High-level flow
1. User submits URL
2. API validates + normalizes URL
3. Server fetches page safely (timeouts, size limits, blocked internal IPs)
4. HTML is reduced to meaningful text + metadata
5. AI generates a short 2-sentence “What you will get” summary + safety notes
6. Result stored and displayed with community reviews and trust score

### Database schema (Supabase/Postgres)

```sql
-- users come from supabase auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.urls (
  id uuid primary key default gen_random_uuid(),
  normalized_url text not null unique,
  submitted_by uuid references auth.users(id),
  title text,
  description text,
  favicon_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  url_id uuid not null references public.urls(id) on delete cascade,
  model text not null,
  summary text not null,
  safety_flags jsonb not null default '{}'::jsonb,
  confidence numeric(4,3),
  created_at timestamptz not null default now(),
  unique (url_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  url_id uuid not null references public.urls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url_id, user_id)
);

create view public.url_scores as
select
  u.id as url_id,
  coalesce(avg(r.rating), 0)::numeric(3,2) as avg_rating,
  count(r.id) as rating_count,
  coalesce((
    0.7 * avg(r.rating) +
    0.3 * (case when (a.safety_flags->>'risk') = 'high' then 1
                when (a.safety_flags->>'risk') = 'medium' then 2.5
                else 5 end)
  ), 0)::numeric(3,2) as trust_score
from public.urls u
left join public.reviews r on r.url_id = u.id
left join public.ai_summaries a on a.url_id = u.id
group by u.id, a.safety_flags;
```

---

## 2) Key Features to Implement

### A. URL submission & scraper (secure pattern)

**Security checklist**
- Accept only `http/https`
- Normalize URL (`new URL`, strip hash, lowercase host)
- DNS/IP checks to prevent SSRF (block localhost/private ranges)
- 8–10s timeout, max response size, text/html only
- Strip scripts/styles before AI prompt
- Never call AI directly from client (server route only)

**Example API route (`app/api/inspect/route.ts`)**

```ts
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_HTML_BYTES = 1_000_000;

function normalizeUrl(input: string) {
  const u = new URL(input.trim());
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only http/https URLs are supported.");
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  return u.toString();
}

function extractText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const title = $("title").first().text().trim();
  const description = $("meta[name='description']").attr("content")?.trim() ?? "";
  const body = $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000);
  return { title, description, body };
}

async function summarizeWithAI(payload: { title: string; description: string; body: string }) {
  // Replace with OpenAI/Anthropic SDK server call
  // Must return exactly 2 concise sentences about what user gets on the page.
  return `This page appears to provide ${payload.title || "information"} with content focused on ${payload.description || "the page topic"}. You should expect reading-oriented content and links related to that subject.`;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const normalizedUrl = normalizeUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "LinkLensBot/1.0 (+preview analyzer)" },
      redirect: "follow",
    }).finally(() => clearTimeout(timeout));

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "URL is not an HTML page." }, { status: 400 });
    }

    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) {
      return NextResponse.json({ error: "Page too large to inspect." }, { status: 413 });
    }

    const extracted = extractText(html);
    const summary = await summarizeWithAI(extracted);

    return NextResponse.json({ normalizedUrl, ...extracted, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to inspect URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

### B. Review system
- Require auth for posting reviews
- One review per user per URL (`unique(url_id, user_id)`)
- Rating: integer 1–5
- Optional text feedback
- Show newest-first timeline + average rating

### C. Trust score
- Suggested formula: `trust = 70% community avg + 30% AI safety score`
- Add AI safety buckets from flags (`safe`, `medium`, `high-risk`)
- Reduce trust when risk flags include phishing/malware/adult/scam patterns
- Show confidence badge when enough reviews (e.g., `rating_count >= 5`)

---

## 3) Frontend UI/UX Blueprint

### Homepage layout
- Top nav (logo, auth button)
- Hero: “Know any link before you click”
- Centered URL input + submit button (main focus)
- Optional “Try examples” chips below input
- Minimal distractions and high contrast

### URL Results Page (`app/url/[id]/page.tsx`)

```tsx
type Review = {
  id: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
};

type UrlResultProps = {
  url: string;
  title: string;
  summary: string;
  trustScore: number;
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
};

export default function UrlResultsPage(props: UrlResultProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 break-all">{props.url}</p>
          <h1 className="mt-2 text-2xl font-semibold">{props.title || "Untitled page"}</h1>

          <div className="mt-5 rounded-xl bg-indigo-50 p-4 border border-indigo-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">AI Preview</p>
            <p className="mt-2 text-slate-700 leading-7">{props.summary}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
              <span className="font-medium">Trust Score:</span> {props.trustScore.toFixed(1)}/5
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
              <span className="font-medium">Community Rating:</span> {props.averageRating.toFixed(1)}/5 ({props.reviewCount})
            </div>
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold">User Reviews</h2>
          <p className="mt-1 text-sm text-slate-500">Community feedback timeline</p>

          <div className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {props.reviews.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews yet. Be the first to rate this link.</p>
            ) : (
              props.reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.userName}</p>
                    <p className="text-sm text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{review.text}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(review.createdAt).toLocaleString()}</p>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
```

---

## 4) Step-by-step Development Roadmap

### Phase 1: MVP (Core URL Insight)
- Next.js + Tailwind + Supabase setup
- URL submission form and `/api/inspect`
- Basic metadata extraction and result page
- Store URL records in `urls`

### Phase 2: AI Integration
- Connect OpenAI/Anthropic server SDK
- Prompt tune for concise 2-sentence output
- Store summaries + safety flags in `ai_summaries`
- Caching/reuse summaries for repeated URLs

### Phase 3: Community Features
- Auth (email/social)
- Create/update review endpoint
- Render review timeline + aggregate rating
- Compute and display trust score

### Phase 4: Scaling + Trust Hardening
- Queue heavy scraping jobs + retry logic
- Add abuse prevention (rate limiting, moderation)
- Improve safety classification pipeline
- Add analytics, observability, and SEO landing pages

---

## Suggested initial project structure

```txt
linklens/
  app/
    page.tsx
    url/[id]/page.tsx
    api/
      inspect/route.ts
      reviews/route.ts
  components/
    UrlSearchBar.tsx
    TrustScoreBadge.tsx
    ReviewForm.tsx
    ReviewTimeline.tsx
  lib/
    db.ts
    url.ts
    scraper.ts
    ai.ts
    trust-score.ts
  supabase/
    migrations/001_init.sql
```
