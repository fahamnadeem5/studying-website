import Link from "next/link";
import type { Metadata } from "next";
import { SUBJECTS } from "@/lib/subjects";
import { subjectCounts } from "@/lib/db";
import { tint } from "@/components/ResourceParts";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why A-Level Hub exists, what it indexes, and where the resources come from. A free, ad-free, single-click index of CAIE A-Level past papers, notes and books.",
  openGraph: {
    title: "About — A-Level Hub",
    description:
      "Why A-Level Hub exists, what it indexes, and where the resources come from.",
    type: "website",
  },
};

export const revalidate = 3600;

export default function AboutPage() {
  const perSubject = SUBJECTS.map((s) => ({ subject: s, counts: subjectCounts(s.code) }));

  return (
    <article>
      <section style={{ paddingTop: "4rem", paddingBottom: "3rem" }}>
        <div className="mx-auto w-full max-w-3xl px-4 text-center">
          <Reveal>
            <span className="badge" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)", color: "var(--brand)", border: "1px solid color-mix(in srgb, var(--brand) 25%, transparent)", padding: "0.35rem 0.9rem", fontSize: "0.75rem", marginBottom: "1.25rem", display: "inline-flex" }}>
              About A-Level Hub
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mx-auto" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>
              We built the <span className="text-gradient-aurora">A-Level</span> resource hub
              <br />
              we wish we&apos;d had.
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto" style={{ fontSize: "1.125rem", lineHeight: 1.65, color: "var(--text-muted)", maxWidth: "40rem", marginBottom: "0.5rem" }}>
              This site was built because other sites were either paid or had a lot of ads and navigation around it.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mx-auto" style={{ fontSize: "1.125rem", lineHeight: 1.65, color: "var(--text)", maxWidth: "40rem", fontWeight: 500 }}>
              This site offers direct access to PDFs and notes in a single click.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <Reveal stagger className="grid gap-4 md:grid-cols-3">
          {[
            { t: "No paywall", d: "Every resource is free. No subscription, no premium tier, no per-paper fee. The whole catalog is right there.", tone: "var(--brand)" },
            { t: "No ads, no detours", d: "The pages are clean, the search is fast, and the link you click opens the file — not another sign-up form or an interstitial asking for your email.", tone: "var(--accent)" },
            { t: "Single-click access", d: "Find a paper, click it, it opens. That's the whole interaction. We treat your time like it matters because it does — exam season doesn't wait.", tone: "#16a34a" },
          ].map((c) => (
            <div key={c.t} className="card" style={{ padding: "1.5rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in srgb, ${c.tone} 12%, transparent)`, color: c.tone, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem", fontWeight: 800, fontSize: "1.1rem" }}>
                {c.t[0]}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>{c.t}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>{c.d}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <Reveal>
          <div className="mb-6 text-center">
            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>How it works</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "32rem", margin: "0 auto" }}>
              We don&apos;t host any exam papers or books. The site is a carefully-built index of public resources from four sources.
            </p>
          </div>
        </Reveal>
        <Reveal stagger className="grid gap-3 md:grid-cols-2">
          {[
            { k: "PapaCambridge", d: "Direct CDN links to every CAIE past paper, mark scheme and grade threshold from 2009 onwards.", color: "var(--brand)" },
            { k: "Notes PapaCambridge", d: "Free revision notes hosted by PapaCambridge's notes archive.", color: "var(--accent)" },
            { k: "Physics & Maths Tutor", d: "PMT's extensive CAIE paper collections, organised by topic.", color: "#d97706" },
            { k: "Reddit", d: "Student-shared files from r/alevel, r/6thForm and r/IGCSE — Drive, Mega, PDFs.", color: "#dc2626" },
          ].map((s) => (
            <div key={s.k} className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: `0 0 12px -2px ${s.color}`, flexShrink: 0, marginTop: 8 }} />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>{s.k}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <Reveal>
          <div className="mb-6 text-center">
            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>What&apos;s inside</h2>
            <p style={{ color: "var(--text-muted)" }}>Six CAIE AS &amp; A Level subjects, four resource types.</p>
          </div>
        </Reveal>
        <Reveal stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {perSubject.map(({ subject, counts }) => (
            <Link key={subject.code} href={`/subjects/${subject.code}`} className="card border-animated" style={{ padding: "1.25rem", display: "block", position: "relative" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold text-white" style={{ background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color} 100%)`, boxShadow: `0 4px 12px -4px ${tint(subject.color, "80")}` }}>
                  {subject.shortName.slice(0, 3).toUpperCase()}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{subject.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-faint)" }}>{subject.code}</div>
                </div>
              </div>
              <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {counts.total.toLocaleString()} resources · {counts.yearly} yearly · {counts.topical} topical
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-12">
        <Reveal>
          <div className="card" style={{ padding: "2rem", background: "var(--surface-muted)" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>A note on copyright</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65, marginBottom: "0.75rem" }}>
              We don&apos;t host, mirror, or re-upload any exam papers, mark schemes, books, or notes. Everything on this site is a link to a file that someone else has already made public.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.65 }}>
              Papers and mark schemes are &copy; Cambridge Assessment International Education. Books and notes are the work of their authors and publishers. Please use these resources for personal study only, and respect each host&apos;s terms of service.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-16 text-center">
        <Reveal>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Ready to start?</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Pick a subject, or search across all of them at once.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/search" className="btn btn-primary">Search all resources</Link>
            <Link href="/" className="btn btn-secondary">Browse subjects</Link>
          </div>
        </Reveal>
      </section>
    </article>
  );
}
