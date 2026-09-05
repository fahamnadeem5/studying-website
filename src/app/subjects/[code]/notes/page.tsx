import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { SectionView } from "@/components/SectionView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const subject = getSubject(code);
  if (!subject) return {};
  return {
    title: `${subject.name} — Notes`,
    description: `Free revision notes and summaries for ${subject.name} (${subject.code}) from community sources.`,
    openGraph: {
      title: `${subject.name} — Notes | A-Level Hub`,
      description: `Revision notes and summaries for ${subject.name} (${subject.code}).`,
    },
  };
}

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  if (!getSubject(code)) notFound();
  const sp = await searchParams;
  const source = typeof sp.source === "string" ? sp.source : undefined;

  return (
    <SectionView
      code={code}
      type="notes"
      title="Notes & Summaries"
      blurb="Free revision notes, summaries and topic notes from PapaCambridge's notes archive and student-shared files on Reddit."
      activeSource={source}
    />
  );
}
