import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/subjects";
import { SectionView } from "@/components/SectionView";

export const metadata: Metadata = { title: "Books" };

export default async function BooksPage({
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
      type="book"
      title="Books & Textbooks"
      blurb="CAIE coursebooks and revision guides (PDFs shared by the study community, mostly via Google Drive/Mega)."
      activeSource={source}
    />
  );
}
