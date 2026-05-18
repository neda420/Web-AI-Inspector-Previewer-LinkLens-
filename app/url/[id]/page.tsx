import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewTimeline } from "@/components/ReviewTimeline";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { getUrlWithScores } from "@/lib/store";

type UrlPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UrlPage({ params }: UrlPageProps) {
  const { id } = await params;
  const data = getUrlWithScores(id);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <Link href="/" className="text-sm font-medium text-indigo-600">
            ← Back
          </Link>

          <p className="mt-4 break-all text-sm text-slate-500">{data.normalizedUrl}</p>
          <h1 className="mt-2 text-2xl font-semibold">{data.title || "Untitled page"}</h1>

          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">AI Preview</p>
            <p className="mt-2 leading-7 text-slate-700">{data.summary}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <TrustScoreBadge trustScore={data.trustScore} risk={data.safetyFlags.risk} />
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
              <span className="font-medium">Community Rating:</span> {data.averageRating.toFixed(1)}/5 ({data.reviewCount})
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Safety Notes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {data.safetyFlags.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">User Reviews</h2>
          <p className="-mt-3 text-sm text-slate-500">Community feedback timeline</p>
          <ReviewForm urlId={data.id} />
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <ReviewTimeline reviews={data.reviews} />
          </div>
        </aside>
      </div>
    </main>
  );
}
