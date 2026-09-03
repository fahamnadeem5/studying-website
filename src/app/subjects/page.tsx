import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { subjectCounts } from "@/lib/db";

export default async function SubjectsIndex() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">All Subjects</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Cambridge International AS &amp; A Level, CAIE.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => {
          const counts = subjectCounts(s.code);
          return (
            <Link
              key={s.code}
              href={`/subjects/${s.code}`}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-extrabold text-white"
                style={{ backgroundColor: s.color }}
              >
                {s.shortName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.code} · {counts.total.toLocaleString()} resources
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
