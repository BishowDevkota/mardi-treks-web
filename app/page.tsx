import Link from "next/link";
import Image from "next/image";
import { Mountain, Users, Map, Shield, ArrowRight, Star } from "lucide-react";

// TODO: Replace with CMS-driven content
// These will be fetched from Payload CMS via getPayloadClient()

const featuredTreks = [
  {
    slug: "everest-base-camp",
    title: "Everest Base Camp Trek",
    subtitle: "Classic Himalayan Adventure",
    duration: "14 Days",
    price: "$1,899",
    difficulty: "Challenging",
    rating: 4.9,
    reviews: 128,
    image: "/images/placeholder-trek.jpg",
  },
  {
    slug: "annapurna-circuit",
    title: "Annapurna Circuit Trek",
    subtitle: "Diverse Landscapes & Culture",
    duration: "16 Days",
    price: "$1,599",
    difficulty: "Moderate",
    rating: 4.8,
    reviews: 95,
    image: "/images/placeholder-trek.jpg",
  },
  {
    slug: "mardi-himal-trek",
    title: "Mardi Himal Trek",
    subtitle: "Off the Beaten Path",
    duration: "10 Days",
    price: "$1,199",
    difficulty: "Moderate",
    rating: 4.7,
    reviews: 67,
    image: "/images/placeholder-trek.jpg",
  },
];

const stats = [
  { icon: Mountain, value: "15+", label: "Trek Packages" },
  { icon: Users, value: "2,000+", label: "Happy Trekkers" },
  { icon: Map, value: "6", label: "Nepal Regions" },
  { icon: Shield, value: "18+", label: "Years Experience" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary-dark">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary-light">
              <Mountain className="mr-1.5 h-4 w-4" />
              Nepal&apos;s Premier Trekking Agency
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Discover the
              <span className="block text-primary-light">Himalayas</span>
              With Expert Guides
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-500 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Treks */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Popular Trekking Packages
            </h2>
            <p className="mt-4 text-lg text-text-muted">
              Handpicked adventures for every type of traveler
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTreks.map((trek) => (
              <Link
                key={trek.slug}
                href={`/treks/${trek.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary-light/10 p-8">
                    <Mountain className="h-16 w-16 text-primary/40" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {trek.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-accent">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{trek.rating}</span>
                      <span className="text-text-muted">({trek.reviews})</span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-primary">
                    {trek.title}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">{trek.subtitle}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm text-text-muted">{trek.duration}</span>
                    <span className="text-lg font-bold text-primary">{trek.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/treks"
              className="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-3 text-base font-semibold text-primary transition-all hover:bg-primary hover:text-white"
            >
              View All Treks
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-surface py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Trek With Us?
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Safety First",
                description:
                  "All our guides are certified, first-aid trained, and carry satellite communication. Your safety is our top priority.",
              },
              {
                icon: Users,
                title: "Expert Local Guides",
                description:
                  "Our guides have decades of combined experience across Nepal's trekking regions. They know every trail intimately.",
              },
              {
                icon: Map,
                title: "Sustainable Tourism",
                description:
                  "We're committed to responsible travel — supporting local communities, minimizing environmental impact, and preserving Nepal's heritage.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready for Your Himalayan Adventure?
          </h2>
          <p className="mt-4 text-lg text-text-muted">
            Whether you&apos;re a seasoned trekker or a first-timer, we have the perfect
            package for you. Let&apos;s make memories that last a lifetime.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark"
            >
              Get in Touch
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/treks"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-semibold text-foreground transition-all hover:bg-surface-alt"
            >
              Browse Treks
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
