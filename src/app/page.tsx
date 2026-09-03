import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { subjectCounts } from "@/lib/db";
import { CountPill, tint } from "@/components/ResourceParts";
import type { SubjectCounts, SubjectMeta } from "@/lib/types";

export const revalidate = 3600;

export default function HomePage() {
  const { perSubject, total } = SUBJECTS.reduce(
    (acc, s) => {
      const counts = subjectCounts(s.code);
      acc.total += counts.total;
      acc.perSubject.push({ subject: s, counts });
      return acc;
    },
    {
      perSubject: [] as Array<{ subject: SubjectMeta; counts: SubjectCounts }>,
      total: 0,
    }
  );
  const isEmpty = total === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="py-6 text-center sm:py-12">
        <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
          CAIE AS &amp; A Level
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Every A-Level resource,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            one search away
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Yearly past papers, topical past papers, notes and books for the six
          big CAIE subjects — indexed from PapaCambridge, Physics &amp; Maths
          Tutor and student-shared files on Reddit. No account, no paywall.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Search all resources
          </Link>
          <a
            href="#subjects"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Browse by subject
          </a>
        </div>
      </section>

      {isEmpty && (
        <div className="mx-auto my-6 max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          The catalog is empty. Populate it by running{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900">
            npm run scrape
          </code>{" "}
          once (it indexes papers, notes and community links from the web), then
          refresh this page.
        </div>
      )}

      <section id="subjects" className="py-6">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Subjects</h2>
          {total > 0 && (
            <p className="text-xs text-zinc-500">
              {total.toLocaleString()} resources indexed
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perSubject.map(({ subject, counts }) => (
            <Link
              key={subject.code}
              href={`/subjects/${subject.code}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.shortName.slice(0, 3).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="font-semibold leading-tight">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {subject.code} · {subject.level}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                <span
                  className="rounded-full px-2 py-1 font-medium"
                  style={{
                    backgroundColor: tint(subject.color, "16"),
                    color: subject.color,
                  }}
                >
                  Yearly {counts.yearly.toLocaleString()}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Topical {counts.topical.toLocaleString()}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Notes {counts.notes.toLocaleString()}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Books {counts.book.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <CountPill n={counts.total} color={subject.color} />
                <span className="text-sm text-zinc-400 transition-transform group-hover:translate-x-0.5">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Yearly past papers",
              d: "Every CAIE session from 2009 onwards — question papers, mark schemes and grade thresholds per paper, straight from PapaCambridge's CDN.",
              i: "📄",
            },
            {
              t: "Topical past papers",
              d: "Questions organised by topic from community collections on Reddit, plus topical notes.",
              i: "🧩",
            },
            {
              t: "Notes",
              d: "Free revision notes from PapaCambridge's notes archive and files shared by students.",
              i: "📝",
            },
            {
              t: "Books",
              d: "CAIE coursebooks & textbooks shared via Google Drive and Mega by the study community.",
              i: "📚",
            },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <div className="text-2xl">{f.i}</div>
              <h3 className="mt-2 font-semibold">{f.t}</h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
