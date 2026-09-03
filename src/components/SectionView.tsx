import { listResources, subjectSources } from "@/lib/db";
import { getSubject } from "@/lib/subjects";
import { siteMeta } from "@/lib/sites";
import { FilterBar } from "./FilterBar";
import { QuickSearch } from "./QuickSearch";
import type { ResourceType } from "@/lib/types";

interface Props {
  code: string;
  type: "topical" | "notes" | "book";
  title: string;
  blurb: string;
  /** current `source` query param (already validated string | undefined) */
  activeSource?: string;
}

/**
 * Shared page body for the topical / notes / books sections:
 * a source filter plus a client-side quick search over the fetched rows.
 */
export async function SectionView({
  code,
  type,
  title,
  blurb,
  activeSource,
}: Props) {
  const subject = getSubject(code);
  if (!subject) return null;

  const rows = listResources({
    subjectCode: code,
    type,
    source: activeSource,
    limit: 4000,
  });
  const sources = subjectSources(code, type);
  const sectionPath = type === "book" ? "books" : type;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          {blurb}
        </p>
      </div>

      <FilterBar
        base={`/subjects/${code}/${sectionPath}`}
        years={[]}
        sessions={[]}
        color={subject.color}
        kinds={[]}
        sources={sources.map((s) => ({ value: s, label: siteMeta(s).label }))}
      />

      <div className="mt-4">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            {activeSource
              ? "No resources from this source yet."
              : "No resources indexed yet. Run `npm run scrape` to populate the catalog."}
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs text-zinc-400">
              {rows.length} resources
              {activeSource ? ` from ${siteMeta(activeSource).label}` : ""}
            </div>
            <QuickSearch rows={rows} accent={subject.color} />
          </>
        )}
      </div>
    </div>
  );
}

export type { ResourceType };
