"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function UrlSearchBar() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to inspect URL.");
      }

      router.push(`/url/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          pattern="https?://.+"
          title="Please enter a valid URL starting with http:// or https://"
          placeholder="https://example.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-indigo-500"
        />
        <button
          disabled={loading}
          className="h-12 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Inspecting..." : "Inspect URL"}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}
