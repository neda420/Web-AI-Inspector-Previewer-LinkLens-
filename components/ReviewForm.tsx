"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ReviewFormProps = {
  urlId: string;
};

export function ReviewForm({ urlId }: ReviewFormProps) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlId, userName, rating, text }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to submit review.");
      }

      setSuccess("Review saved.");
      setText("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Add or update your review</h3>

      <input
        required
        placeholder="Your name"
        value={userName}
        onChange={(event) => setUserName(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />

      <div>
        <label htmlFor="rating" className="mb-1 block text-xs font-medium text-slate-600">
          Rating (1-5)
        </label>
        <input
          id="rating"
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <textarea
        placeholder="Optional review"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <button
        disabled={loading}
        className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
      >
        {loading ? "Saving..." : "Save review"}
      </button>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
    </form>
  );
}
