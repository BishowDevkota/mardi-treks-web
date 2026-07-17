import Link from "next/link";
import { Mountain, ArrowRight } from "lucide-react";

export function FallbackHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary-dark to-foreground">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1920&q=80')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-secondary-dark/60 via-secondary-dark/30 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Mountain className="mr-1.5 h-4 w-4" />
            Nepal&apos;s Premier Trekking Agency
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover the
            <span className="block text-primary">Himalayas</span>
            With Expert Guides
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90">
            From Everest Base Camp to hidden valleys, experience Nepal&apos;s breathtaking
            landscapes with our expert-guided trekking and tour packages. Sustainable,
            safe, and unforgettable.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/treks"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark hover:shadow-xl"
            >
              Explore Treks
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
