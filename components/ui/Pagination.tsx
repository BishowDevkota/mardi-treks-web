import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildPages(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");

    pages.push(totalPages);

    return pages;
  }

  const pages = buildPages();

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Blog pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-all hover:border-primary/30 hover:text-primary"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-border bg-surface text-text-muted/40">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="flex h-10 w-10 items-center justify-center text-sm text-text-muted">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
              page === currentPage
                ? "bg-primary text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:border-primary/30 hover:text-primary"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-all hover:border-primary/30 hover:text-primary"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-border bg-surface text-text-muted/40">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
