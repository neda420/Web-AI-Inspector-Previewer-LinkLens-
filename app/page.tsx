import Link from "next/link";
import { UrlSearchBar } from "@/components/UrlSearchBar";

const examples = ["https://developer.mozilla.org", "https://nextjs.org", "https://www.wikipedia.org"];
const highlights = [
  {
    title: "AI Page Preview",
    description: "Get a concise snapshot of what a URL contains before opening it.",
  },
  {
    title: "Safety Signal Checks",
    description: "Review risk hints based on suspicious language and URL safety guards.",
  },
  {
    title: "Community Ratings",
    description: "See public ratings and reviews to make more confident click decisions.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col p-6 md:p-10">
        <header className="flex items-center justify-between py-2">
          <Link href="/" className="text-lg font-semibold text-sky-300">
            LinkLens
          </Link>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">Live URL Inspector</span>
        </header>

        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-12">
          <p className="rounded-full border border-sky-600/40 bg-sky-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            Web AI Inspector & Previewer
          </p>
          <h1 className="mt-5 text-center text-4xl font-bold tracking-tight sm:text-6xl">
            Understand any website
            <span className="block text-sky-300">before you open it.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-center text-base text-slate-300 sm:text-lg">
            Paste a link and LinkLens will generate a content preview, risk notes, and a trust score built from AI checks and community feedback.
          </p>

          <div className="mt-10 w-full rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/60 backdrop-blur-sm sm:p-7">
            <UrlSearchBar />
            <div className="mt-6 flex flex-wrap gap-2">
              {examples.map((item) => (
                <span key={item} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-sm font-semibold text-sky-200">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
