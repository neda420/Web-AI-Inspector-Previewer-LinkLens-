import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Result not found</h1>
      <p className="text-sm text-slate-400">Inspect a URL first, then open its result page.</p>
      <Link href="/" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950">
        Go home
      </Link>
    </main>
  );
}
