import type { ResourceRow } from "@/lib/types";
import { SITES } from "@/lib/sites";
import {
  KindBadge,
  SessionBadge,
  SourceChip,
  UpdatedNote,
  CopyLinkButton,
} from "./ResourceParts";

interface Props {
  row: ResourceRow;
  /** show subject color as the left accent (3px bar) */
  accent?: string;
  /** hide the right-side action buttons (compact list variant) */
  compact?: boolean;
}

export function ResourceRowView({ row, accent, compact = false }: Props) {
  const meta = parseMeta(row.metadata);
  const isReddit = row.source === "reddit";
  const threadUrl =
    meta && typeof meta.redditPermalink === "string"
      ? meta.redditPermalink
      : null;
  const subreddit =
    meta && typeof meta.subreddit === "string" ? meta.subreddit : "alevel";

  const isFresh = isRecent(row.first_seen, 14);

  const ariaParts = [row.title];
  if (row.kind && row.kind !== "other") ariaParts.push(row.kind.toUpperCase());
  if (row.year) ariaParts.push(String(row.year));

  return (
    <div
      className="card"
      style={{
        position: "relative",
        padding: compact ? "0.7rem 0.9rem" : "0.85rem 1rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        ...(accent
          ? { borderLeft: `3px solid ${accent}` }
          : {}),
      }}
    >
      {accent && !compact && (
        <span
          aria-hidden
          className="float-bob"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 10px -1px ${accent}`,
            opacity: 0.7,
          }}
        />
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ariaParts.join(" — ")}
            className="text-gradient-on-hover"
            style={{
              fontSize: compact ? "0.825rem" : "0.875rem",
              fontWeight: 600,
              lineHeight: 1.4,
              color: "var(--text)",
              textDecoration: "none",
            }}
          >
            {row.title}
          </a>
          <KindBadge kind={row.kind} />
          {isFresh && !compact && (
            <span
              className="badge"
              style={{
                background: "color-mix(in srgb, var(--brand) 14%, transparent)",
                color: "var(--brand)",
                border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              NEW
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem 0.75rem",
            marginTop: "0.35rem",
          }}
        >
          <SessionBadge row={row} />
          {row.paper && (
            <span
              style={{ fontSize: "0.7rem", color: "var(--text-faint)" }}
            >
              {row.paper}
            </span>
          )}
          {row.topic && !compact && (
            <span
              style={{ fontSize: "0.7rem", color: "var(--text-faint)" }}
            >
              {row.topic}
            </span>
          )}
          <SourceChip source={row.source} />
          {!compact && <UpdatedNote row={row} />}
          {isReddit && threadUrl && !compact && (
            <a
              href={threadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.7rem",
                color: "#ea580c",
                textDecoration: "none",
              }}
              className="hover:underline"
            >
              r/{subreddit} thread ↗
            </a>
          )}
        </div>

        {row.description && !compact && (
          <p
            style={{
              marginTop: "0.4rem",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {row.description}
          </p>
        )}
      </div>

      {!compact && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            flexShrink: 0,
          }}
        >
          <CopyLinkButton url={row.url} />
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              padding: "0.4rem 0.7rem",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
            aria-label={`Open ${row.title}`}
          >
            Open ↗
          </a>
        </div>
      )}
    </div>
  );
}

function parseMeta(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isRecent(sqliteDate: string, withinDays: number): boolean {
  const t = new Date(sqliteDate.replace(" ", "T") + "Z").getTime();
  if (!t) return false;
  return Date.now() - t < withinDays * 24 * 3600 * 1000;
}

export function sourceLabel(source: string): string {
  return SITES[source]?.label ?? source;
}
