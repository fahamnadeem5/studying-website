"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SubjectCounts } from "@/lib/types";

const TABS = [
  { type: "yearly", path: "yearly", icon: "📄", label: "Yearly Papers" },
  { type: "topical", path: "topical", icon: "🧩", label: "Topical" },
  { type: "notes", path: "notes", icon: "📝", label: "Notes" },
  { type: "book", path: "books", icon: "📚", label: "Books" },
] as const;

export function SubjectNav({
  code,
  counts,
  color,
}: {
  code: string;
  counts: SubjectCounts;
  color: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto">
      {TABS.map((t) => {
        const href = `/subjects/${code}/${t.path}`;
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={t.type}
            href={href}
            className="whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: active ? color : "transparent",
              color: active
                ? color
                : "var(--tw-zinc-600, rgb(82 82 91))",
              backgroundColor: active ? "rgba(255,255,255,0.5)" : "transparent",
            }}
          >
            {t.icon} {t.label}
            <span className="ml-1.5 text-[11px] opacity-60">
              {counts[t.type] ?? 0}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
