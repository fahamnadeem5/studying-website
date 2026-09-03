import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { subjectCounts, listResources } from "@/lib/db";
import { tint } from "@/components/ResourceParts";
import type { ResourceType } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const s = getSubject(code);
  return { title: s ? `${s.name} (${s.code})` : "Subject" };
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

  const sections: Array<{
    type: ResourceType;
    path: string;
    icon: string;
    title: string;
    desc: string;
  }> = [
    {
      type: "yearly",
      path: "yearly",
      icon: "📄",
      title: "Yearly Past Papers",
      desc: "Every session since 2009 — QPs, mark schemes, grade thresholds.",
    },
    {
      type: "topical",
      path: "topical",
      icon: "🧩",
      title: "Topical Past Papers",
      desc: "Questions organised by topic from community collections.",
    },
    {
      type: "notes",
      path: "notes",
      icon: "📝",
      title: "Notes",
      desc: "Free revision notes & summaries from around the web.",
    },
    {
      type: "book",
      path: "books",
      icon: "📚",
      title: "Books",
      desc: "CAIE coursebooks & textbooks shared by students.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {counts.total > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((sec) => {
            const preview = listResources({
              subjectCode: code,
              type: sec.type,
              limit: 3,
            });
            return (
              <Link
                key={sec.type}
                href={`/subjects/${code}/${sec.path}`}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: tint(subject.color, "18") }}
                  >
                    {sec.icon}
                  </span>
                  <div className="flex-1">
                    <h2 className="font-semibold">{sec.title}</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {sec.desc}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-sm font-bold"
                    style={{
                      backgroundColor: tint(subject.color, "16"),
                      color: subject.color,
                    }}
                  >
                    {counts[sec.type].toLocaleString()}
                  </span>
                </div>
                {preview.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {preview.slice(0, 2).map((r) => (
                      <li key={r.id} className="truncate">
                        • {r.title}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="mt-3 text-sm font-medium text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
                  Browse {sec.title.toLowerCase()} →
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-8 text-center text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-semibold">Nothing indexed for {subject.name} yet.</p>
          <p className="mt-1">
            Run <code className="font-mono text-xs">npm run scrape</code> from the
            project root to build the catalog, then refresh.
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <span aria-hidden className="text-lg">
          🔍
        </span>
        <p className="flex-1 text-zinc-600 dark:text-zinc-300">
          Looking for something specific? Search the full {subject.name}{" "}
          collection — or ask Reddit live.
        </p>
        <Link
          href={`/search?subject=${code}`}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search {subject.shortName}
        </Link>
      </div>
    </div>
  );
}
