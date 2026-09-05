import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubject, SUBJECTS } from "@/lib/subjects";
import {
  db,
  subjectCounts,
  listResources,
} from "@/lib/db";
import { TypeIcon } from "@/components/ResourceParts";
import Reveal from "@/components/Reveal";
import { EmptyState } from "@/components/EmptyState";

// Approximate CAIE syllabus topic count per subject (for coverage bar)
const SYLLABUS_TOPIC_COUNTS: Record<string, number> = {
  9709: 142,
  9702: 118,
  9618: 48,
  9231: 52,
  9700: 98,
  9701: 104,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const s = getSubject(code);
  if (!s) return {};
  const counts = subjectCounts(code);
  return {
    title: `${s.name} (${s.code}) — A-Level Hub`,
    description: `${s.name} CAIE A-Level resources: ${counts.total.toLocaleString()} indexed papers, notes, textbooks and more. Browse yearly past papers, topical questions, revision notes and books.`,
    openGraph: {
      title: `${s.name} (${s.code}) — A-Level Hub`,
      description: `${s.name} CAIE A-Level resources. ${counts.total.toLocaleString()} indexed resources including yearly past papers, topical papers, notes and books.`,
    },
  };
}

export default async function SubjectLanding({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const subject = getSubject(code);
  if (!subject) notFound();
  const counts = subjectCounts(code);

  const latestRaw = db()
    .prepare(
      `SELECT title, last_verified FROM resources
       WHERE subject_code = ? AND is_stale = 0
       ORDER BY last_verified DESC LIMIT 1`
    )
    .get(code) as { title: string; last_verified: string } | undefined;

  const latestDate = latestRaw
    ? new Date(latestRaw.last_verified).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const topicRow = db()
    .prepare(
      `SELECT COUNT(DISTINCT topic) AS n FROM resources
       WHERE subject_code = ? AND is_stale = 0 AND topic IS NOT NULL`
    )
    .get(code) as { n: number } | undefined;
  const topicCount = topicRow?.n ?? 0;
  const syllabusCount = SYLLABUS_TOPIC_COUNTS[code] ?? 100;
  const coveragePct = Math.min(100, Math.round((topicCount / syllabusCount) * 100));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">

      {/* ── Hero ─────────────────────────────────────────── */}
      <Reveal>
        <div
          className="rounded-3xl p-6 md:p-8 mb-8 border"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${subject.color} 6%, var(--surface)) 0%, var(--surface) 60%)`,
            borderColor: `color-mix(in srgb, ${subject.color} 20%, var(--border))`,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl font-extrabold text-white"
                  style={{ background: subject.color }}
                >
                  {subject.shortName.slice(0, 2).toUpperCase()}
                </span>
                <span
                  className="text-sm font-medium rounded-full px-2.5 py-1"
                  style={{
                    background: `color-mix(in srgb, ${subject.color} 12%, var(--surface))`,
                    color: subject.color,
                  }}
                >
                  {subject.level}
                </span>
              </div>

              <h1
                className="text-4xl md:text-5xl font-extrabold leading-tight"
                style={{
                  background: `linear-gradient(135deg, ${subject.color} 0%, color-mix(in srgb, ${subject.color} 60%, var(--accent)) 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {subject.name}
              </h1>
              <p
                className="mt-1 text-base font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {subject.code} · Cambridge International AS &amp; A Level
              </p>
              <p
                className="mt-3 text-sm leading-relaxed max-w-xl"
                style={{ color: "var(--text-muted)" }}
              >
                {counts.total.toLocaleString()} indexed resources — past papers, mark
                schemes, grade thresholds, topical questions, notes and textbooks, all
                one click away.
              </p>

              {/* Stats strip */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    { label: "Yearly", n: counts.yearly, icon: "📄" },
                    { label: "Topical", n: counts.topical, icon: "🧩" },
                    { label: "Notes", n: counts.notes, icon: "📝" },
                    { label: "Books", n: counts.book, icon: "📚" },
                  ] as const
                ).map(({ label, n, icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${subject.color} 10%, var(--surface-muted))`,
                      color: subject.color,
                      border: `1px solid color-mix(in srgb, ${subject.color} 25%, var(--border))`,
                    }}
                  >
                    {icon} {n.toLocaleString()} {label}
                  </span>
                ))}
              </div>

              {/* Latest chip */}
              {latestDate && (
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      background: "color-mix(in srgb, var(--brand) 10%, var(--surface-muted))",
                      color: "var(--brand)",
                      border: "1px solid color-mix(in srgb, var(--brand) 25%, var(--border))",
                    }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--brand)" }}
                    />
                    Latest added {latestDate}
                  </span>
                </div>
              )}

              {/* Coverage bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-faint)" }}>
                  <span>Topic coverage</span>
                  <span>
                    {topicCount} / ~{syllabusCount} topics · {coveragePct}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${coveragePct}%`,
                      background: `linear-gradient(90deg, ${subject.color}, color-mix(in srgb, ${subject.color} 70%, var(--accent)))`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: live-search CTA */}
            <div className="shrink-0 flex flex-col items-center gap-4">
              <div
                className="rounded-2xl p-5 text-center border"
                style={{
                  background: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, ${subject.color} 12%, transparent)`,
                    color: subject.color,
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Live Reddit Search
                </p>
                <p
                  className="mt-1 text-xs leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  See what students are sharing right now for {subject.shortName}.
                </p>
                <Link
                  href={`/live-search?subject=${code}`}
                  className="mt-3 btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem" }}
                >
                  Search Reddit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Section Cards ─────────────────────────────────── */}
      {counts.total > 0 ? (
        <Reveal stagger>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                {
                  type: "yearly",
                  path: "yearly",
                  label: "Yearly Papers",
                  icon: "📄",
                  desc: "Every session since 2009 — QPs, mark schemes, grade thresholds.",
                },
                {
                  type: "topical",
                  path: "topical",
                  label: "Topical",
                  icon: "🧩",
                  desc: "Questions organised by topic from community collections.",
                },
                {
                  type: "notes",
                  path: "notes",
                  label: "Notes",
                  icon: "📝",
                  desc: "Free revision notes & summaries from around the web.",
                },
                {
                  type: "book",
                  path: "books",
                  label: "Books",
                  icon: "📚",
                  desc: "CAIE coursebooks & textbooks shared by students.",
                },
              ] as const
            ).map((sec) => {
              const preview = listResources({
                subjectCode: code,
                type: sec.type,
                limit: 3,
              });
              return (
                <Link
                  key={sec.type}
                  href={`/subjects/${code}/${sec.path}`}
                  className="card group flex flex-col rounded-2xl border border-[var(--border)] p-5 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <TypeIcon type={sec.type} />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold">{sec.label}</h2>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {sec.desc}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-sm font-bold shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${subject.color} 12%, var(--surface))`,
                        color: subject.color,
                      }}
                    >
                      {counts[sec.type].toLocaleString()}
                    </span>
                  </div>
                  {preview.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {preview.slice(0, 2).map((r) => (
                        <li
                          key={r.id}
                          className="truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          • {r.title}
                        </li>
                      ))}
                    </ul>
                  )}
                  <span
                    className="mt-3 text-sm font-medium group-hover:text-[var(--brand)] transition-colors"
                    style={{ color: "var(--text-faint)" }}
                  >
                    Browse {sec.label.toLowerCase()} →
                  </span>
                </Link>
              );
            })}
          </div>
        </Reveal>
      ) : (
        <EmptyState
          icon="papers"
          title={`No resources indexed for ${subject.name} yet`}
          description="Run npm run scrape from the project root to build the catalog, then refresh."
          action={{ label: "Learn about the site", href: "/about" }}
        />
      )}

      {/* ── Related Subjects ─────────────────────────────── */}
      <Reveal>
        <div
          className="mt-8 pt-8"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            More subjects
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.filter((s) => s.code !== code).map((s) => {
              const sc = subjectCounts(s.code);
              return (
                <Link
                  key={s.code}
                  href={`/subjects/${s.code}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent transition-all hover:border-[var(--border)] hover:bg-[var(--surface-elevated)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                    style={{ background: s.color }}
                  >
                    {s.shortName.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {sc.total.toLocaleString()} resources
                    </p>
                  </div>
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--text-faint)", flexShrink: 0 }}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>

    </div>
  );
}
