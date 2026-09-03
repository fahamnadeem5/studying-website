import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import {
  listResources,
  subjectSessions,
  subjectSources,
  subjectYears,
} from "@/lib/db";
import { FilterBar } from "@/components/FilterBar";
import { ResourceRowView } from "@/components/ResourceRowView";
import { siteMeta } from "@/lib/sites";
import type { ResourceRow, SessionLetter } from "@/lib/types";
import { SESSION_NAMES } from "@/lib/types";

export const metadata: Metadata = { title: "Yearly Past Papers" };

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
  const year = Number(sp.year) || undefined;
  const session = (sp.session as SessionLetter) || undefined;
  const kind = typeof sp.kind === "string" ? sp.kind : undefined;
  const source = typeof sp.source === "string" ? sp.source : undefined;

  const rows = listResources({
    subjectCode: code,
    type: "yearly",
    year,
    session,
    kind,
    source,
    limit: 4000,
  });
  const years = subjectYears(code);
  const sessions = subjectSessions(code);
  const sources = subjectSources(code, "yearly");

  const groups = groupBySession(rows);
  const filtered = Boolean(year || session || kind || source);
  const filteredNote = filtered ? ` · filtered to ${rows.length}` : "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Yearly Past Papers</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
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
      <p className="mt-3 text-xs text-zinc-400">
        {groups.length} session{groups.length === 1 ? "" : "s"}
        {filteredNote}
      </p>

      {groups.length === 0 ? (
        <EmptyYearly />
      ) : (
        <div className="mt-4 space-y-2">
          {groups.map((g, idx) => (
            <SessionGroup
              key={g.key}
              group={g}
              color={subject.color}
              defaultOpen={idx < 2}
            />
          ))}
        </div>
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
  defaultOpen,
}: {
  group: Group;
  color: string;
  defaultOpen: boolean;
}) {
  return (
    <details
      className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold">{group.label}</span>
        <span className="text-xs text-zinc-400">
          {group.rows.length} file{group.rows.length === 1 ? "" : "s"}
        </span>
        <span className="ml-auto text-xs text-zinc-400">expand ▾</span>
      </summary>
      <div className="space-y-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
        {group.rows.map((r) => (
          <ResourceRowView key={r.id} row={r} accent={color} />
        ))}
      </div>
    </details>
  );
}

function EmptyYearly() {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
      No papers match these filters. Try widening the year range or clearing
      filters above.
    </div>
  );
}
