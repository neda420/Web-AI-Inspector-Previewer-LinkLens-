import Link from "next/link";
import { UrlSearchBar } from "@/components/UrlSearchBar";

const examples = ["https://developer.mozilla.org", "https://nextjs.org", "https://www.wikipedia.org"];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col p-6">
        <header className="flex items-center justify-between py-2">
          <Link href="/" className="text-lg font-semibold text-indigo-700">
            LinkLens
          </Link>
          <span className="text-sm text-slate-500">MVP Preview</span>
        </header>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
          <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Know any link before you click</h1>
          <p className="mt-4 text-center text-slate-600">Paste a URL to preview what the page is about, review safety hints, and share feedback.</p>

          <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <UrlSearchBar />
            <div className="mt-5 flex flex-wrap gap-2">
              {examples.map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
