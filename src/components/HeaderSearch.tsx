"use client";

import { useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search (⌘K)"
        title="Search (⌘K)"
        className="btn btn-ghost"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 0.7rem",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          border: "1px solid var(--border)",
        }}
      >
        <svg
          aria-hidden
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd
          className="hidden sm:inline"
          style={{
            fontSize: "0.6rem",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "0.1rem 0.35rem",
            background: "var(--surface)",
            color: "var(--text-faint)",
          }}
        >
          ⌘K
        </kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}