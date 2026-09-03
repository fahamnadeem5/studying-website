import type { ResourceRow } from "@/lib/types";
import { SITES } from "@/lib/sites";
import { KindBadge, SessionBadge, SourceChip } from "./ResourceParts";

interface Props {
  row: ResourceRow;
  /** show subject color dot on the left */
  accent?: string;
}

export function ResourceRowView({ row, accent }: Props) {
  const meta = parseMeta(row.metadata);
  const isReddit = row.source === "reddit";
  const threadUrl =
    meta && typeof meta.redditPermalink === "string"
      ? meta.redditPermalink
      : null;
  const subreddit =
    meta && typeof meta.subreddit === "string" ? meta.subreddit : "alevel";

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      {accent && (
        <span
          aria-hidden
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium leading-snug text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
          >
            {row.title}
          </a>
          <KindBadge kind={row.kind} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <SessionBadge row={row} />
          {row.paper && (
            <span className="text-[11px] text-zinc-400">{row.paper}</span>
          )}
          {row.topic && (
            <span className="text-[11px] text-zinc-400">Topic: {row.topic}</span>
          )}
          <SourceChip source={row.source} />
          {isReddit && threadUrl && (
            <a
              href={threadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-orange-500 hover:underline"
            >
              r/{subreddit} thread ↗
            </a>
          )}
        </div>
        {row.description && (
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
            {row.description}
          </p>
        )}
      </div>
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Open ↗
      </a>
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

export function sourceLabel(source: string): string {
  return SITES[source]?.label ?? source;
}
