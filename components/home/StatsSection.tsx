"use client";

import { useRef, useState, useEffect } from "react";

interface Stat {
  icon: string;
  value: string;
  label: string;
}

function useCountUp(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}

function StatCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const count = useCountUp(value, 2000, inView);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center p-6">
      {/* Animated value */}
      <span className="block text-4xl font-bold text-secondary sm:text-5xl">
        {count}+
      </span>

      {/* Label */}
      <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-primary">
        {label}
      </span>
    </div>
  );
}

export function StatsSection({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => {
            const numericValue =
              parseInt(stat.value.replace(/[^0-9]/g, ""), 10) || 0;
            return (
              <StatCard
                key={stat.label}
                value={numericValue}
                label={stat.label}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
