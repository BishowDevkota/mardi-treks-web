"use client";

import { useState, useEffect } from "react";
import {
  Route,
  CheckCircle,
  DollarSign,
  Map,
  HelpCircle,
  Mail,
} from "lucide-react";
import { useGalleryLightbox } from "./GalleryContext";

interface SectionNavProps {
  hasItinerary?: boolean;
  hasInclusions?: boolean;
  hasPricing?: boolean;
  hasFaqs?: boolean;
  sectionOrder?: string[];
}

export function SectionNav({
  hasItinerary = true,
  hasInclusions = true,
  hasPricing = true,
  hasFaqs = true,
  sectionOrder,
}: SectionNavProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const { isLightboxOpen } = useGalleryLightbox();

  // Build nav items and sort by the saved section order
  const sections = [
    hasItinerary && { id: "itinerary", label: "Itinerary", icon: Route },
    hasInclusions && { id: "inEx", label: "Inclusions", icon: CheckCircle },
    hasPricing && { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "map", label: "Map", icon: Map },
    hasFaqs && { id: "faqs", label: "FAQs", icon: HelpCircle },
    { id: "contact", label: "Contact", icon: Mail },
  ].filter(Boolean) as { id: string; label: string; icon: any }[];

  // Sort nav items to match the page section order
  if (sectionOrder && sectionOrder.length > 0) {
    const orderMap: Record<string, number> = {};
    sectionOrder.forEach((id, i) => { orderMap[id] = i; });
    sections.sort((a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999));
  }

  useEffect(() => {
    // Observe sections for active state
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    // Observe hero to hide nav when hero is visible
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    const hero = document.getElementById("hero");
    if (hero) heroObserver.observe(hero);

    // Observe footer to hide nav when visible
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    const footer = document.querySelector("footer");
    if (footer) footerObserver.observe(footer);

    return () => {
      sectionObserver.disconnect();
      heroObserver.disconnect();
      footerObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length]);

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav
      className={`pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-out ${
        isHeroVisible || isFooterVisible || isLightboxOpen
          ? "translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div
        className="pointer-events-auto flex w-full items-center justify-around gap-0.5 overflow-x-auto bg-secondary px-2 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.18)] backdrop-blur-md sm:mb-4 sm:w-auto sm:gap-1 sm:rounded-full sm:px-2.5 sm:py-2 sm:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] sm:ring-1 sm:ring-white/10"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="group relative flex min-w-0 shrink-0 flex-col items-center gap-1 px-3 py-1.5 sm:px-3.5"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? "-translate-y-0.5 bg-primary text-white shadow-md shadow-primary/30"
                    : "text-white/55 group-hover:bg-white/10 group-hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.25 : 2} />
              </span>
              <span
                className={`whitespace-nowrap text-[9.5px] font-semibold tracking-wide transition-colors duration-300 ${
                  isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}