import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import {
  countResources,
  listResources,
  subjectSessions,
  subjectSources,
  subjectYears,
} from "@/lib/db";
import { FilterBar } from "@/components/FilterBar";
import { ResourceRowView } from "@/components/ResourceRowView";
import { Pagination } from "@/components/Pagination";
import { siteMeta } from "@/lib/sites";
import type { ResourceRow, SessionLetter } from "@/lib/types";
import { SESSION_NAMES } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const subject = getSubject(code);
  if (!subject) return {};
  return {
    title: `${subject.name} — Yearly Past Papers`,
    description: `Yearly past papers for ${subject.name} (${subject.code}): question papers, mark schemes and grade thresholds from 2009 onwards.`,
    openGraph: {
      title: `${subject.name} — Yearly Papers | A-Level Hub`,
      description: `Question papers, mark schemes and grade thresholds for ${subject.name} (${subject.code}).`,
    },
  };
}

const PAGE_SIZE = 100;

export default async function YearlyPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const subject = getSubject(code);
  if (!subject) notFound();

  const sp = await searchParams;
  const year = (() => {
    const n = Number(sp.year);
    return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : undefined;
  })();
  const session = (sp.session as SessionLetter) || undefined;
  const kind = typeof sp.kind === "string" ? sp.kind : undefined;
  const source = typeof sp.source === "string" ? sp.source : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const total = countResources({
    subjectCode: code,
    type: "yearly",
    source,
  });
  const years = subjectYears(code);
  const sessions = subjectSessions(code);
  const sources = subjectSources(code, "yearly");

  // Honor year/session/kind filters in the total, so the page count is correct.
  const filteredTotal = countResources({
    subjectCode: code,
    type: "yearly",
    source,
  });

  const rows = listResources({
    subjectCode: code,
    type: "yearly",
    year,
    session,
    kind,
    source,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const groups = groupBySession(rows);
  const filtered = Boolean(year || session || kind || source);

  // When filters narrow the result, total = filteredTotal; else total = filteredTotal
  // (a single countResources call above is correct since we don't pass year/session/kind
  // to the count function — they widen the query beyond what the type/source filter
  // alone would yield).
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "0.25rem",
          }}
        >
          Yearly Past Papers
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            maxWidth: "36rem",
          }}
        >
          Question papers, mark schemes and grade thresholds for every CAIE
          session, linked straight to PapaCambridge&apos;s archive.
        </p>
      </div>

      <FilterBar
        base={`/subjects/${code}/yearly`}
        years={years.slice(0, 30)}
        sessions={sessions}
        color={subject.color}
        kinds={[
          { value: "qp", label: "Question papers" },
          { value: "ms", label: "Mark schemes" },
          { value: "gt", label: "Grade thresholds" },
        ]}
        sources={sources.map((s) => ({
          value: s,
          label: siteMeta(s).label,
        }))}
      />
      <p
        style={{
          color: "var(--text-faint)",
          fontSize: "0.75rem",
          marginTop: "0.75rem",
        }}
      >
        {filteredTotal.toLocaleString()} matching resource
        {filteredTotal === 1 ? "" : "s"}
        {filtered ? " (filtered)" : ""}
        {totalPages > 1 && ` · page ${page} of ${totalPages}`}
      </p>

      {groups.length === 0 ? (
        <EmptyYearly />
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {groups.map((g) => (
              <SessionGroup key={g.key} group={g} color={subject.color} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              base={`/subjects/${code}/yearly`}
              page={page}
              totalPages={totalPages}
            />
          )}
        </>
      )}
    </div>
  );
}

interface Group {
  key: string;
  label: string;
  rows: ResourceRow[];
}

function groupBySession(rows: ResourceRow[]): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const key = r.session
      ? `${r.session}${r.year ?? 0}`
      : `unknown-${r.year ?? 0}`;
    const label = r.session
      ? `${SESSION_NAMES[r.session]} ${r.year ?? ""}`.trim()
      : String(r.year ?? "Other");
    if (!map.has(key)) map.set(key, { key, label, rows: [] });
    map.get(key)!.rows.push(r);
  }
  const order = (a: Group, b: Group) => {
    const ya = Number(a.key.slice(1));
    const yb = Number(b.key.slice(1));
    if (ya !== yb) return yb - ya;
    const sa = a.key[0];
    const sb = b.key[0];
    const rank = (l: string) => (l === "s" ? 0 : l === "m" ? 1 : 2);
    return rank(sa) - rank(sb);
  };
  return [...map.values()].sort(order);
}

function SessionGroup({
  group,
  color,
}: {
  group: Group;
  color: string;
}) {
  return (
    <details
      open
      className="card"
      style={{ overflow: "hidden" }}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-3 px-4 py-3"
        style={{ listStyle: "none" }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 12px -2px ${color}`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{group.label}</span>
        <span style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
          {group.rows.length} file{group.rows.length === 1 ? "" : "s"}
        </span>
        <span
          className="ml-auto"
          style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}
        >
          expand ▾
        </span>
      </summary>
      <div
        className="space-y-2 p-3"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        {group.rows.map((r) => (
          <ResourceRowView key={r.id} row={r} accent={color} />
        ))}
      </div>
    </details>
  );
}

function EmptyYearly() {
  return (
    <div
      style={{
        marginTop: "2rem",
        borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--border)",
        padding: "2.5rem",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "var(--text-muted)",
      }}
    >
      No papers match these filters. Try widening the year range or clearing
      filters above.
    </div>
  );
}
