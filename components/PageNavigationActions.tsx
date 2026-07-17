"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function PageNavigationActions() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-medium text-sky-300 transition hover:text-sky-200"
      >
        ← Back to previous page
      </button>
      <Link href="/" className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800">
        Exit
      </Link>
    </div>
  );
}
