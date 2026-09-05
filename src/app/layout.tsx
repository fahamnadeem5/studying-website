import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuroraBackground from "@/components/AuroraBackground";
import ThemeToggle from "@/components/ThemeToggle";
import { HeaderSearch } from "@/components/HeaderSearch";
import { CommandPalette } from "@/components/CommandPalette";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "A-Level Hub — CAIE Past Papers, Notes & Books",
    template: "%s · A-Level Hub",
  },
  description:
    "Every CAIE A-Level resource in one place: yearly past papers, topical papers, notes and books for Maths, Physics, Computer Science, Further Maths, Biology and Chemistry — links from PapaCambridge, Reddit and more.",
  metadataBase: new URL("https://studying-website.vercel.app"),
  openGraph: {
    title: "A-Level Hub",
    description:
      "Yearly & topical past papers, notes and books for CAIE A-Level Maths, Physics, CS, Further Maths, Bio & Chem.",
    type: "website",
    siteName: "A-Level Hub",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A-Level Hub",
    description:
      "Yearly & topical past papers, notes and books for CAIE A-Level.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (t === 'light' || t === 'dark') {
                    document.documentElement.setAttribute('data-theme', t);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{ background: "var(--surface)", color: "var(--text)" }}>
        <AuroraBackground />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-white focus:font-bold focus:shadow-lg"
        >
          Skip to main content
        </a>

        <header
          className="glass sticky top-0 z-30"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold tracking-tight transition-opacity hover:opacity-80"
              style={{ color: "var(--text)" }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black text-white"
                style={{
                  background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)",
                  boxShadow: "0 0 16px -4px color-mix(in srgb, var(--brand) 60%, transparent)",
                }}
              >
                AL
              </span>
              <span className="hidden sm:inline">A-Level Hub</span>
            </Link>

            <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 transition-colors hover:bg-[var(--surface-muted)]"
                style={{ color: "var(--text-muted)" }}
              >
                Subjects
              </Link>
              <HeaderSearch />
              <Link
                href="/about"
                className="rounded-lg px-3 py-1.5 transition-colors hover:bg-[var(--surface-muted)]"
                style={{ color: "var(--text-muted)" }}
              >
                About
              </Link>
              <div className="ml-1">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </header>

        <main id="main" style={{ minHeight: "calc(100vh - 56px - 120px)" }}>
          {children}
        </main>

        <CommandPalette open={false} onClose={() => {}} />

        <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface-muted)" }}>
          <div
            className="mx-auto w-full max-w-6xl px-4 py-8 text-xs leading-relaxed"
            style={{ color: "var(--text-faint)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p
                  className="mb-1 font-semibold"
                  style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}
                >
                  A-Level Hub — a community index of CAIE A-Level resources.
                </p>
                <p className="max-w-3xl">
                  This site does not host any exam papers or books. It indexes links
                  to external resources hosted by PapaCambridge, Physics &amp; Maths
                  Tutor, and files shared by students on Reddit. We are not
                  affiliated with Cambridge Assessment International Education. Papers
                  are &copy; Cambridge Assessment International Education; please
                  only use them for personal study, and respect each
                  host&apos;s terms.
                </p>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <Link
                  href="/about"
                  className="transition-colors hover:text-[var(--brand)]"
                  style={{ color: "var(--text-faint)" }}
                >
                  About this site
                </Link>
                <Link
                  href="/search"
                  className="transition-colors hover:text-[var(--brand)]"
                  style={{ color: "var(--text-faint)" }}
                >
                  Search resources
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
