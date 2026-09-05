import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

export const metadata = {
  title: "Page Not Found — A-Level Hub",
  description: "The page you're looking for doesn't exist or has been removed.",
};

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-56px-120px)] flex items-center justify-center px-4">
      <div className="text-center">
        <EmptyState
          icon="search"
          title="Page not found"
          description="The page you're looking for doesn't exist or has been removed."
          action={{
            label: "Back to all subjects",
            href: "/subjects",
          }}
        />
        <p className="mt-4 text-sm text-muted" style={{ color: "var(--text-faint)" }}>
          Try searching for what you need, or browse the subjects below.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Link
            href="/search"
            className="btn btn-ghost hover:text-[var(--brand)] transition-colors"
          >
            🔍 Search resources
          </Link>
          <Link
            href="/subjects"
            className="btn btn-ghost hover:text-[var(--brand)] transition-colors"
          >
            📚 All subjects
          </Link>
        </div>
      </div>
    </main>
  );
}