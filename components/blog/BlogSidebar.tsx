"use client";

import { useState, useEffect } from "react";

type TocItem = {
  id: string;
  title: string;
  level?: number;
};

type BlogSidebarProps = {
  tocItems?: TocItem[];
};

export default function BlogSidebar({ tocItems: providedItems }: BlogSidebarProps) {
  const [autoItems, setAutoItems] = useState<TocItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

  // If no tocItems prop is passed, build the TOC from the article's own headings
  useEffect(() => {
    if (providedItems) return;

    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TocItem[] = [];

    elements.forEach((el) => {
      const id = el.id || el.textContent?.toLowerCase().replace(/\s+/g, "-") || "";
      if (!el.id) el.id = id;
      items.push({ id, title: el.textContent || "", level: parseInt(el.tagName[1]) });
    });

    setAutoItems(items);
  }, [providedItems]);

  const tocItems = providedItems ?? autoItems;

  const handleItemClick = (id: string) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!tocItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  if (!tocItems.length) return null;

  return (
    <>
      {/* Menu Button - Hidden on lg and above, positioned left, slightly below top */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-[5.5rem] left-4 flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-surface/90 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-surface-alt z-40"
        aria-label="Open table of contents"
        title="Table of Contents"
      >
        <svg
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="h-5 w-5 text-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Desktop sidebar - Hidden below lg */}
      <div className="hidden lg:flex lg:flex-col rounded-2xl border border-border bg-surface shadow-sm overflow-hidden max-h-[70vh]">
        <div className="shrink-0 px-6 py-6 border-b border-border shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-6 rounded-full bg-primary" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
              Contents
            </h3>
          </div>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto p-3">
          <TocList tocItems={tocItems} activeId={activeId} onItemClick={handleItemClick} />
        </nav>
      </div>

      {/* Mobile modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 left-0 h-screen w-80 max-w-[90vw] bg-surface shadow-2xl overflow-hidden lg:hidden z-50 flex flex-col">
            <div className="shrink-0 px-6 py-6 border-b border-border shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-6 rounded-full bg-primary" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                  Contents
                </h3>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 hover:bg-surface-alt"
                aria-label="Close table of contents"
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-5 w-5 text-foreground"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex-1 min-h-0 overflow-y-auto p-3">
              <TocList tocItems={tocItems} activeId={activeId} onItemClick={handleItemClick} />
            </nav>
          </div>
        </>
      )}
    </>
  );
}

function TocList({
  tocItems,
  activeId,
  onItemClick,
}: {
  tocItems: TocItem[];
  activeId: string;
  onItemClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {tocItems.map((item, index) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={`${item.id}-${index}`}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              onItemClick(item.id);
            }}
            className={`toc-link group relative px-4 py-3 flex items-center gap-3 rounded-xl transition-all duration-300 hover:bg-primary/10 ${
              item.level === 3 ? "ml-3" : ""
            } ${isActive ? "bg-primary/10" : ""}`}
          >
            <div
              className={`absolute left-0 w-1 rounded-r-full bg-primary transition-all duration-300 ${
                isActive ? "h-1/2" : "h-0 group-hover:h-1/3"
              }`}
            />
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-all duration-300 group-hover:scale-110 ${
                isActive ? "bg-primary text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={`text-sm leading-snug transition-colors duration-300 group-hover:translate-x-1 flex-1 ${
                isActive ? "font-semibold text-foreground" : "font-medium text-text-muted"
              }`}
            >
              {item.title}
            </span>
          </a>
        );
      })}
    </div>
  );
}