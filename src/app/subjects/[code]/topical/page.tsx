import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { SectionView } from "@/components/SectionView";

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
