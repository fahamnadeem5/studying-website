import type { Metadata } from "next";
import { SUBJECTS } from "@/lib/subjects";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search across 8,000+ indexed CAIE A-Level past papers, mark schemes, notes, and books. Filter by subject, year, session, kind or source.",
  openGraph: {
    title: "Search — A-Level Hub",
    description:
      "Search across all indexed CAIE A-Level past papers, mark schemes, notes, and books.",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const subject =
    typeof sp.subject === "string" && SUBJECTS.some((s) => s.code === sp.subject)
      ? sp.subject
      : "";

  return (
    <SearchClient
      initialQuery={q}
      initialSubject={subject}
      subjects={SUBJECTS.map((s) => ({ code: s.code, name: s.name }))}
    />
  );
}
