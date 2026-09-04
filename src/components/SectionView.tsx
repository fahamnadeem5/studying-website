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
  activeSource?: string;
}

const FETCH_CAP = 1500;

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
    limit: FETCH_CAP + 1,
  });
  const sources = subjectSources(code, type);
  const sectionPath = type === "book" ? "books" : type;

  const overflowed = rows.length > FETCH_CAP;
  const visible = overflowed ? rows.slice(0, FETCH_CAP) : rows;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
          {title}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "36rem" }}>
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
        {visible.length === 0 ? (
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border)",
              padding: "2.5rem",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "var(--text-muted)",
            }}
          >
            {activeSource
              ? "No resources from this source yet."
              : "No resources indexed yet. Run `npm run scrape` to populate the catalog."}
          </div>
        ) : (
          <>
            <div
              style={{
                color: "var(--text-faint)",
                fontSize: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              {visible.length.toLocaleString()} resources
              {activeSource ? ` from ${siteMeta(activeSource).label}` : ""}
              {overflowed && (
                <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                  (showing the first {FETCH_CAP.toLocaleString()} — narrow with a source filter for more)
                </span>
              )}
            </div>
            <QuickSearch rows={visible} accent={subject.color} />
          </>
        )}
      </div>
    </div>
  );
}

export type { ResourceType };
