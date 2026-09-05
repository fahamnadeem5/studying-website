"use client";

import { useEffect, useRef, useState } from "react";
import { ResourceRowView } from "./ResourceRowView";
import type { ResourceRow } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelectedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setRows([]);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q: q.trim() });
      fetch(`/api/search?${params}`)
        .then((r) => r.json())
        .then((d: { resources?: ResourceRow[]; error?: string }) => {
          if (d.error) setRows([]);
          else setRows(d.resources ?? []);
        })
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const r = rows[selectedIndex];
      if (r) {
        window.open(r.url, "_blank", "noopener,noreferrer");
        onClose();
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="reveal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.15s var(--ease-out-quint)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 680,
          margin: "0 1.5rem",
          borderRadius: "var(--radius-xl)",
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl), var(--shadow-glow)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.9rem 1rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-muted)",
          }}
        >
          <svg
            aria-hidden
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--text-faint)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search papers, notes, books…"
            aria-label="Search query"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "1rem",
              color: "var(--text)",
              width: "100%",
            }}
          />
          <kbd
            style={{
              fontSize: "0.65rem",
              padding: "0.15rem 0.45rem",
              borderRadius: "4px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-faint)",
            }}
          >
            ⌘K
          </kbd>
        </div>

        <div
          ref={listRef}
          style={{
            maxHeight: "55vh",
            overflow: "auto",
          }}
        >
          {loading && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  border: "2px solid color-mix(in srgb, var(--brand) 30%, transparent)",
                  borderTopColor: "var(--brand)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  marginRight: "0.5rem",
                  verticalAlign: "middle",
                }}
              />
              Searching…
            </div>
          )}
          {rows.length > 0 && (
            <div style={{ padding: "0.5rem 0.75rem" }}>
              {rows.slice(0, 6).map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.6rem 0.5rem",
                    borderRadius: "var(--radius)",
                    background: i === selectedIndex
                      ? "color-mix(in srgb, var(--brand) 10%, var(--surface))"
                      : "transparent",
                    border: i === selectedIndex
                      ? "1px solid color-mix(in srgb, var(--brand) 30%, var(--border))"
                      : "none",
                    cursor: "pointer",
                    transition: "background 0.1s, border-color 0.1s",
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => {
                    window.open(r.url, "_blank", "noopener,noreferrer");
                    onClose();
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--text)",
                        lineHeight: 1.3,
                      }}
                    >
                      {r.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                        marginTop: "0.2rem",
                        fontSize: "0.65rem",
                        color: "var(--text-faint)",
                      }}
                    >
                      <span
                        style={{
                          background: "var(--surface-muted)",
                          border: "1px solid var(--border)",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "0.25rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {r.kind.toUpperCase()}
                      </span>
                      {r.year && (
                        <span style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                          {r.year}
                        </span>
                      )}
                      {r.session && (
                        <span style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                          {r.session.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    aria-hidden
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--text-faint)", flexShrink: 0 }}
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
              ))}
            </div>
          )}
          {!loading && q.trim().length >= 2 && rows.length === 0 && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              No results for &ldquo;{q}&rdquo;
            </div>
          )}
          {!loading && q.trim().length < 2 && (
            <div
              style={{
                padding: "1.5rem 1rem",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.5rem",
                }}
              >
                Try searching for
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {["9709 pure 1", "9702 paper 5", "9700 cell biology", "9618 algorithms", "physics textbook", "topical questions"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQ(s)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      background: "var(--surface-muted)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--brand)";
                      e.currentTarget.style.color = "var(--brand)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "0.6rem 1rem",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--surface-muted)",
            fontSize: "0.7rem",
            color: "var(--text-faint)",
          }}
        >
          ↑↓ navigate · ↵ open · esc close
        </div>
      </div>
    </div>
  );
}