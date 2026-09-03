import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { subjectCounts } from "@/lib/db";
import { tint } from "@/components/ResourceParts";
import { SubjectNav } from "@/components/SubjectNav";

export default async function SubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const subject = getSubject(code);
  if (!subject) notFound();
  const counts = subjectCounts(code);

  return (
    <div>
      <div
        className="border-b"
        style={{
          borderColor: "transparent",
          background: `linear-gradient(180deg, ${tint(subject.color, "10")}, transparent 70%)`,
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 pt-8">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← All subjects
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-extrabold text-white"
              style={{ backgroundColor: subject.color }}
            >
              {subject.shortName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {subject.name}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Cambridge International AS &amp; A Level · {subject.code}
              </p>
            </div>
            {counts.total > 0 && (
              <span
                className="ml-auto hidden rounded-full px-3 py-1 text-sm font-semibold sm:inline"
                style={{
                  backgroundColor: tint(subject.color, "16"),
                  color: subject.color,
                }}
              >
                {counts.total.toLocaleString()} resources
              </span>
            )}
          </div>

          <SubjectNav code={code} counts={counts} color={subject.color} />
        </div>
      </div>
      {children}
    </div>
  );
}
