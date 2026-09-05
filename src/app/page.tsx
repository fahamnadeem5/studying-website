import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { subjectCounts } from "@/lib/db";
import { CountPill } from "@/components/ResourceParts";
import { tint } from "@/lib/utils";
import Reveal from "@/components/Reveal";
import type { SubjectCounts, SubjectMeta } from "@/lib/types";

export const revalidate = 3600;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "A-Level Hub",
  url: "https://studying-website.vercel.app",
  description:
    "Every CAIE A-Level resource in one place: yearly past papers, topical papers, notes and books for Maths, Physics, CS, Further Maths, Biology and Chemistry.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://studying-website.vercel.app/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  const { perSubject, total } = SUBJECTS.reduce(
    (acc, s) => {
      const counts = subjectCounts(s.code);
      acc.total += counts.total;
      acc.perSubject.push({ subject: s, counts });
      return acc;
    },
    {
      perSubject: [] as Array<{ subject: SubjectMeta; counts: SubjectCounts }>,
      total: 0,
    }
  );
  const isEmpty = total === 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div className="mx-auto w-full max-w-6xl px-4 text-center">
          <Reveal>
            <span
              className="badge"
              style={{
                background: "color-mix(in srgb, var(--brand) 12%, transparent)",
                color: "var(--brand)",
                border: "1px solid color-mix(in srgb, var(--brand) 25%, transparent)",
                padding: "0.35rem 0.9rem",
                fontSize: "0.75rem",
                marginBottom: "1.25rem",
                display: "inline-flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <span
                className="glow-pulse"
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--brand)",
                  color: "var(--brand)",
                }}
              />
              CAIE AS &amp; A Level
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1
              className="mx-auto"
              style={{
                maxWidth: "56rem",
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "1.25rem",
              }}
            >
              One click to every{" "}
              <span className="text-gradient-aurora">A-Level</span> PDF.
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p
              className="mx-auto"
              style={{
                maxWidth: "44rem",
                fontSize: "1.125rem",
                lineHeight: 1.6,
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              This site was built because other sites were either paid or had
              a lot of ads and navigation around it.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p
              className="mx-auto"
              style={{
                maxWidth: "44rem",
                fontSize: "1.125rem",
                lineHeight: 1.6,
                color: "var(--text-muted)",
                marginBottom: "2rem",
              }}
            >
              This site offers{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                direct access to PDFs and notes in a single click
              </span>{" "}
              — no paywall, no clutter, no detours.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/search" className="btn btn-primary">
                Search all resources
              </Link>
              <a href="#subjects" className="btn btn-secondary">
                Browse by subject
              </a>
            </div>
          </Reveal>

          {!isEmpty && (
            <Reveal delay={550}>
              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Subjects", value: String(SUBJECTS.length) },
                  { label: "Resources", value: total.toLocaleString() },
                  { label: "Sources", value: "4" },
                  { label: "Always free", value: "Yes" },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                    <div className="text-gradient" style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.1 }}>
                      {s.value}
                    </div>
                    <div style={{ color: "var(--text-faint)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: "0.25rem" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {isEmpty && (
        <section className="mx-auto w-full max-w-3xl px-4 pb-8">
          <Reveal>
            <div className="card border-animated noise" style={{ padding: "2rem", position: "relative" }}>
              <div className="badge" style={{ background: "color-mix(in srgb, #d97706 12%, transparent)", color: "#d97706", border: "1px solid color-mix(in srgb, #d97706 30%, transparent)", marginBottom: "0.75rem" }}>
                Setup needed
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                The catalog is empty
              </h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                Populate the index by running the scraper once.
              </p>
              <ol style={{ paddingLeft: "1.25rem", color: "var(--text-muted)", lineHeight: 1.8 }}>
                <li>Run <code className="rounded-md px-1.5 py-0.5 font-mono text-xs" style={{ background: "var(--surface-muted)", color: "var(--text)" }}>npm run scrape</code> once</li>
                <li>Wait for it to finish — you&apos;ll see &quot;Done in Xs.&quot;</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </Reveal>
        </section>
      )}

      <section id="subjects" className="mx-auto w-full max-w-6xl px-4 py-8">
        <Reveal>
          <div className="mb-6">
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
              Subjects
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {total > 0 ? `${total.toLocaleString()} resources indexed across all sources` : "Six subjects, one search away"}
            </p>
          </div>
        </Reveal>

        <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perSubject.map(({ subject, counts }) => (
            <Link
              key={subject.code}
              href={`/subjects/${subject.code}`}
              className="card border-animated noise"
              style={{ padding: "1.5rem", position: "relative", display: "block" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color} 100%)`,
                      boxShadow: `0 4px 12px -4px ${tint(subject.color, "80")}`,
                    }}
                  >
                    {subject.shortName.slice(0, 3).toUpperCase()}
                  </span>
                  <div>
                    <h3 style={{ fontWeight: 700, lineHeight: 1.2, fontSize: "1.05rem" }}>
                      {subject.name}
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "0.1rem" }}>
                      {subject.code} · {subject.level}
                    </p>
                  </div>
                </div>
                <span style={{ color: "var(--text-faint)", fontSize: "1.1rem", lineHeight: 1 }}>
                  →
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                <span className="badge" style={{ background: tint(subject.color, "14"), color: subject.color }}>
                  Yearly {counts.yearly.toLocaleString()}
                </span>
                <span className="badge" style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}>
                  Topical {counts.topical.toLocaleString()}
                </span>
                <span className="badge" style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}>
                  Notes {counts.notes.toLocaleString()}
                </span>
                <span className="badge" style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}>
                  Books {counts.book.toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <CountPill n={counts.total} color={subject.color} />
                <span style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>Open →</span>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <Reveal>
          <div className="mb-6">
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
              What&apos;s inside
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Four kinds of resources, indexed from the open web and the community.
            </p>
          </div>
        </Reveal>

        <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Yearly past papers", d: "Every CAIE session from 2009 onwards — question papers, mark schemes and grade thresholds, straight from PapaCambridge's CDN.", tone: "var(--brand)" },
            { t: "Topical past papers", d: "Questions organised by topic from community collections on Reddit, plus topical notes.", tone: "var(--accent)" },
            { t: "Notes", d: "Free revision notes from PapaCambridge's notes archive and files shared by students.", tone: "#d97706" },
            { t: "Books", d: "CAIE coursebooks & textbooks shared via Google Drive and Mega by the study community.", tone: "#16a34a" },
          ].map((f) => (
            <div key={f.t} className="card" style={{ padding: "1.25rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, ${f.tone} 12%, transparent)`, color: f.tone, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem", fontSize: "1.25rem", fontWeight: 700 }}>
                {f.t[0]}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>{f.t}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>{f.d}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <Reveal>
          <div className="card border-animated" style={{ padding: "2.5rem", position: "relative" }}>
            <span className="badge" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)", color: "var(--brand)", border: "1px solid color-mix(in srgb, var(--brand) 25%, transparent)", marginBottom: "0.75rem" }}>
              Why this exists
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.75rem", lineHeight: 1.15 }}>
              The hub we wish we had during revision.
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, maxWidth: "48rem", marginBottom: "1.5rem" }}>
              We built A-Level Hub because every other place we tried during our A-Levels had a paywall,
              an ad wall, or six redirects before the PDF. This is the inverse: one search bar,
              a single click, and you&apos;re in the file. That&apos;s it.
            </p>
            <Reveal stagger className="grid gap-3 sm:grid-cols-3">
              {[
                { t: "No paywall", d: "Every link is free. We don't host content — we index what's already public." },
                { t: "No ads, no detours", d: "Clean pages, fast search, no popups, no interstitials." },
                { t: "One click to open", d: "Click a resource, it opens. No email signup. No &quot;continue with Google&quot;." },
              ].map((c) => (
                <div key={c.t} style={{ padding: "1rem", borderRadius: "var(--radius)", background: "var(--surface-muted)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--text)" }}>{c.t}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{c.d}</div>
                </div>
              ))}
            </Reveal>
          </div>
        </Reveal>
      </section>
    </>
  );
}
