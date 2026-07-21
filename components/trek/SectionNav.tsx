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
    <nav className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-300 ${isHeroVisible || isFooterVisible || isLightboxOpen ? "translate-y-full" : "translate-y-0"}`}>
      <div className="flex w-full items-center justify-around overflow-x-auto px-1 py-2 sm:w-1/2 sm:rounded-t-2xl sm:shadow-[0_-2px_12px_rgba(0,0,0,0.12)] pointer-events-auto" style={{ backgroundColor: "var(--color-secondary)" }}>
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all min-w-0 ${
              activeId === id
                ? "bg-white/15 text-white shadow-inner backdrop-blur-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-[9px] font-medium whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
