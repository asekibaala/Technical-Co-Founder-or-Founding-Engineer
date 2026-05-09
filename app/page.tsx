"use client";

import { useState, type FormEvent } from "react";

type ApiResponse = { questions: string[] } | { error: string };

export default function Home() {
  const [jobTitle, setJobTitle] = useState("Customer Success Manager");
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: jobTitle.trim() }),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok || "error" in data) {
        throw new Error(("error" in data && data.error) || `Request failed (${res.status})`);
      }
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Interview Question Generator</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Enter a job title to get three thoughtful, role-specific interview questions.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Customer Success Manager"
          maxLength={120}
          required
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-base shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
        />
        <button
          type="submit"
          disabled={loading || !jobTitle.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </form>

      <section className="mt-10" aria-live="polite">
        {loading && (
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
            Generating questions…
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {questions.length > 0 && (
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li
                key={i}
                className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="mr-2 font-semibold text-neutral-500">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
