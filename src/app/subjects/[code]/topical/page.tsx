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
    title: `${subject.name} — Topical Past Papers`,
    description: `Topical past paper questions for ${subject.name} (${subject.code}), organised by topic from community collections.`,
    openGraph: {
      title: `${subject.name} — Topical Papers | A-Level Hub`,
      description: `Topical questions for ${subject.name} (${subject.code}), organised by topic.`,
    },
  };
}

export const metadata: Metadata = { title: "Topical Past Papers" };

export default async function TopicalPage({
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
      type="topical"
      title="Topical Past Papers"
      blurb="Past-paper questions organised by topic — community-compiled files shared on Reddit (Drive/Mega PDFs) plus any topical notes indexed for this subject."
      activeSource={source}
    />
  );
}
