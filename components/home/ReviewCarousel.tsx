"use client";

import { useState, useCallback } from "react";
import { Star, Quote } from "lucide-react";

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  trek: {
    title: string;
    slug: string;
  } | null;
}

export function ReviewCarousel({
  reviews,
  heading,
  description,
}: {
  reviews: Review[];
  heading?: string | null;
  description?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback((index: number) => {
    setActiveIndex(((index % reviews.length) + reviews.length) % reviews.length);
  }, [reviews.length]);

  if (!reviews.length) return null;
  const current = reviews[activeIndex];

  return (
    <section className="bg-background py-20" aria-labelledby="reviews-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Heading */}
        <div className="text-center">
          <h2 id="reviews-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
            {heading || "What Our Trekkers Say"}
          </h2>
          <p className="mt-3 text-base text-text-muted">
            {description || "Real experiences shared by our happy trekkers."}
          </p>
        </div>

        {/* Review Card */}
        <div className="mt-12">
          <div className="relative rounded-[40px] bg-gradient-to-br from-primary/10 to-secondary/10 p-1">
            <div className="relative overflow-hidden rounded-[38px] bg-surface shadow-xl shadow-secondary/5">
              
              <div className="relative p-8 sm:p-12">
                <Quote size={100} className="absolute -right-4 -top-4 rotate-12 text-primary/5" />

                {/* Rating */}
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${i < current.rating ? "fill-primary text-primary" : "text-border"}`}
                    />
                  ))}
                </div>

                {/* Review Text */}
                <blockquote className="mt-8 text-xl leading-9 text-text sm:text-2xl font-light italic">
                  “{current.text}”
                </blockquote>

                {/* Author */}
                <div className="mt-10 border-t border-border pt-8">
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-white">
                      {current.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{current.author}</h3>
                      {current.trek && (
                        <span className="mt-1 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                          {current.trek.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        {reviews.length > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-border hover:bg-primary/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}