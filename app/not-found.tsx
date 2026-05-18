import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-slate-900">
      <h1 className="text-2xl font-semibold">Result not found</h1>
      <p className="text-sm text-slate-600">Inspect a URL first, then open its result page.</p>
      <Link href="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
        Go home
      </Link>
    </main>
  );
}
