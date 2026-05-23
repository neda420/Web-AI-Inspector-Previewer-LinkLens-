import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewTimeline } from "@/components/ReviewTimeline";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { getUrlWithScores } from "@/lib/store";
import { computeTrustScore } from "@/lib/trust-score";
import type { SafetyFlags, UrlWithScores } from "@/lib/types";

// Most browsers enforce a ~4KB max cookie size.
const MAX_FALLBACK_COOKIE_VALUE_LENGTH = 4096;

function isValidSafetyFlags(value: unknown): value is SafetyFlags {
  if (!value || typeof value !== "object") return false;
  const maybeFlags = value as Partial<SafetyFlags>;
  const validRisk = maybeFlags.risk === "safe" || maybeFlags.risk === "medium" || maybeFlags.risk === "high";
  return validRisk && Array.isArray(maybeFlags.reasons);
}

type UrlPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UrlPage({ params }: UrlPageProps) {
  const { id } = await params;
  let data = await getUrlWithScores(id);

  if (!data) {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get("linklens_last_result")?.value;

    if (cookieValue && cookieValue.length <= MAX_FALLBACK_COOKIE_VALUE_LENGTH) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieValue)) as Partial<UrlWithScores>;
        if (parsed.id === id && isValidSafetyFlags(parsed.safetyFlags)) {
          const reviewCount = typeof parsed.reviewCount === "number" ? parsed.reviewCount : 0;
          const averageRating = typeof parsed.averageRating === "number" ? parsed.averageRating : 0;
          data = {
            id,
            normalizedUrl: parsed.normalizedUrl ?? "",
            title: parsed.title ?? "",
            description: parsed.description ?? "",
            summary: parsed.summary ?? "",
            safetyFlags: parsed.safetyFlags,
            createdAt: parsed.createdAt ?? new Date().toISOString(),
            reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
            reviewCount,
            averageRating,
            trustScore: computeTrustScore(averageRating, parsed.safetyFlags),
          };
        }
      } catch {
        // Ignore malformed cookie and fall through to notFound.
      }
    }
  }

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 md:p-10 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50 lg:col-span-2">
          <Link href="/" className="text-sm font-medium text-sky-300">
            ← Back
          </Link>

          <p className="mt-4 break-all text-sm text-slate-400">{data.normalizedUrl}</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{data.title || "Untitled page"}</h1>
          {data.description ? <p className="mt-3 text-sm text-slate-300">{data.description}</p> : null}

          <div className="mt-5 rounded-xl border border-sky-600/30 bg-sky-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">AI Preview</p>
            <p className="mt-2 leading-7 text-slate-200">{data.summary}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <TrustScoreBadge trustScore={data.trustScore} risk={data.safetyFlags.risk} />
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              <span className="font-medium">Community Rating:</span> {data.averageRating.toFixed(1)}/5 ({data.reviewCount})
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Safety Notes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {data.safetyFlags.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50">
          <h2 className="text-lg font-semibold">User Reviews</h2>
          <p className="-mt-3 text-sm text-slate-400">Community feedback timeline</p>
          <ReviewForm urlId={data.id} />
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <ReviewTimeline reviews={data.reviews} />
          </div>
        </aside>
      </div>
    </main>
  );
}
