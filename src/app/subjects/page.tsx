import type { Metadata } from "next";
import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { subjectCounts } from "@/lib/db";
import Reveal from "@/components/Reveal";
import { TypeIcon } from "@/components/ResourceParts";

export const metadata: Metadata = {
  title: "All Subjects",
  description: "Browse all 6 CAIE A-Level subjects: Mathematics, Physics, Computer Science, Further Mathematics, Biology and Chemistry. Each subject has thousands of indexed past papers, notes and books.",
  openGraph: {
    title: "All Subjects — A-Level Hub",
    description: "Browse all 6 CAIE A-Level subjects with thousands of indexed past papers, notes and books.",
  },
};

export default async function SubjectsIndex() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <Reveal>
        <div className="mb-8 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gradient">
            All Subjects
          </h1>
          <p className="mt-2 text-lg" style={{ color: "var(--text-muted)" }}>
            Cambridge International AS & A Level — every subject in one place
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-faint)" }}>
            {SUBJECTS.reduce((sum, s) => sum + subjectCounts(s.code).total, 0).toLocaleString()}
            total resources across {SUBJECTS.length} subjects
          </p>
        </div>
      </Reveal>

      {/* Subject Grid */}
      <Reveal stagger>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((s) => {
            const counts = subjectCounts(s.code);
            return (
              <Link
                key={s.code}
                href={`/subjects/${s.code}`}
                className="card group p-5 flex flex-col"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-extrabold text-white"
                    style={{ background: s.color }}
                  >
                    {s.shortName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold truncate">{s.name}</h2>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {s.code} · {s.level}
                    </p>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(
                    [
                      { type: "yearly", label: "Y", n: counts.yearly },
                      { type: "topical", label: "T", n: counts.topical },
                      { type: "notes", label: "N", n: counts.notes },
                      { type: "book", label: "B", n: counts.book },
                    ] as const
                  ).map(({ type, label, n }) => (
                    n > 0 && (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold"
                        style={{
                          background: `color-mix(in srgb, ${s.color} 10%, var(--surface-muted))`,
                          color: s.color,
                        }}
                      >
                        {label} {n.toLocaleString()}
                      </span>
                    )
                  ))}
                </div>

                {/* Arrow footer */}
                <div className="mt-auto pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <p
                    className="text-sm font-medium group-hover:text-[var(--brand)] transition-colors"
                    style={{ color: "var(--text-faint)" }}
                  >
                    Explore {s.shortName}
                  </p>
                  <svg
                    aria-hidden
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--brand)", transition: "transform 0.2s" }}
                    className="group-hover:translate-x-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </Reveal>

      {/* Quick links / CTA */}
      <Reveal>
        <div className="mt-10 pt-8 border-t border-[var(--border-subtle)]">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>
            Need something specific?
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/search"
              className="card p-4 text-center hover:border-[var(--brand)]"
            >
              <TypeIcon type="yearly" className="mx-auto mb-2" style={{ width: 32, height: 32 }} />
              <p className="font-semibold">Search all resources</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Filter by subject, year, topic, source…
              </p>
            </Link>
            <Link
              href="/live-search"
              className="card p-4 text-center hover:border-[var(--accent)]"
            >
              <svg
                className="mx-auto mb-2"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--accent)" }}
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p className="font-semibold">Live Reddit search</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                What students are sharing right now
              </p>
            </Link>
            <Link
              href="/about"
              className="card p-4 text-center hover:border-[var(--brand)]"
            >
              <svg
                className="mx-auto mb-2"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--brand)" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p className="font-semibold">About this site</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Why we built this and how it works
              </p>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}