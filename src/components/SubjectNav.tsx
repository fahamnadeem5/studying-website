"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SubjectCounts } from "@/lib/types";
import { TypeIcon } from "./ResourceParts";

const TABS = [
  { type: "yearly", path: "yearly", label: "Yearly Papers" },
  { type: "topical", path: "topical", label: "Topical" },
  { type: "notes", path: "notes", label: "Notes" },
  { type: "book", path: "books", label: "Books" },
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
    <nav
      aria-label="Subject sections"
      className="mt-6"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          .snav-row::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="snav-row" style={{ display: "flex", gap: "0.25rem" }}>
          {TABS.map((t) => {
            const href = `/subjects/${code}/${t.path}`;
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={t.type}
                href={href}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "var(--radius)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: active ? color : "var(--text-muted)",
                  background: active
                    ? `color-mix(in srgb, ${color} 12%, var(--surface))`
                    : "transparent",
                  border: `1px solid ${active ? `color-mix(in srgb, ${color} 30%, var(--border))` : "transparent"}`,
                  textDecoration: "none",
                  transition: "all 0.2s var(--ease-out-quint)",
                  whiteSpace: "nowrap",
                }}
              >
                <TypeIcon type={t.type} />
                {t.label}
                <span
                  style={{
                    fontSize: "0.7rem",
                    opacity: 0.6,
                    background: "var(--surface-muted)",
                    color: "var(--text-faint)",
                    borderRadius: "9999px",
                    padding: "0.05rem 0.45rem",
                  }}
                >
                  {counts[t.type] ?? 0}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}