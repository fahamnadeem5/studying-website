import Link from "next/link";

interface PaginationProps {
  base: string;
  page: number;
  totalPages: number;
}

/**
 * Pagination — server-rendered prev / next + a small page counter. Designed
 * to read existing query params from the page URL by simply tacking on
 * &page=N; the FilterBar's existing param parsing handles the rest.
 */
export function Pagination({ base, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}page=${p}`;
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex items-center justify-center gap-2"
    >
      <PageLink
        href={href(Math.max(1, page - 1))}
        disabled={page === 1}
        rel="prev"
      >
        ← Prev
      </PageLink>
      <span
        style={{
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          padding: "0 0.5rem",
        }}
      >
        Page <strong style={{ color: "var(--text)" }}>{page}</strong> of {totalPages}
      </span>
      <PageLink
        href={href(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        rel="next"
      >
        Next →
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  rel,
  children,
}: {
  href: string;
  disabled: boolean;
  rel?: "prev" | "next";
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        rel={rel}
        style={{
          padding: "0.5rem 0.85rem",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          color: "var(--text-faint)",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "not-allowed",
          opacity: 0.5,
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      rel={rel}
      className="btn btn-secondary"
      style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
    >
      {children}
    </Link>
  );
}
