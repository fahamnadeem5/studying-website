import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "A-Level Hub — CAIE Past Papers, Notes & Books",
    template: "%s · A-Level Hub",
  },
  description:
    "Every CAIE A-Level resource in one place: yearly past papers, topical papers, notes and books for Maths, Physics, Computer Science, Further Maths, Biology and Chemistry — links from PapaCambridge, Reddit and more.",
  metadataBase: new URL("https://alevelhub.example.com"),
  openGraph: {
    title: "A-Level Hub",
    description:
      "Yearly & topical past papers, notes and books for CAIE A-Level Maths, Physics, CS, Further Maths, Bio & Chem.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-sky-500 text-sm text-white">
                AL
              </span>
              <span className="hidden sm:inline">A-Level Hub</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Subjects
              </Link>
              <Link
                href="/search"
                className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Search
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-6xl px-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              A-Level Hub — a community index of CAIE A-Level resources.
            </p>
            <p className="mt-1 max-w-3xl">
              This site does not host any exam papers or books. It indexes links to
              external resources hosted by PapaCambridge, Physics &amp; Maths Tutor,
              and files shared by students on Reddit. We are not affiliated with
              Cambridge Assessment International Education. Papers are © Cambridge
              Assessment International Education; please only use them for personal
              study, and respect each host&apos;s terms.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
