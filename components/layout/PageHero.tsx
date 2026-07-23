import { SearchBar } from "@/components/search/SearchBar";

interface Trek {
  title: string;
  slug: string;
  region: string | null;
  difficulty: string;
  duration: number;
  category?: { slug: string } | null;
}

interface PageHeroProps {
  heading: string;
  description?: string | null;
  backgroundImage?: string | null;
  treks?: Trek[];
}

export function PageHero({ heading, description, backgroundImage, treks }: PageHeroProps) {
  const overlayStyle = {
    background: `
      linear-gradient(180deg, rgba(15,12,8,0.02) 0%, rgba(12,10,7,0.15) 25%, rgba(12,10,7,0.55) 55%, rgba(12,10,7,0.88) 100%),
      linear-gradient(90deg, rgba(12,10,7,0.45) 0%, rgba(12,10,7,0) 55%)
    `,
  };

  return (
    <section className="relative isolate flex min-h-[clamp(520px,82vh,860px)] flex-col overflow-hidden">
      {/* Background image or gradient fallback */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dk7ggjvlw/image/upload/${backgroundImage})`,
            transform: "scale(1.02)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-dark via-primary-dark/20 to-gray-900" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 z-[1]" style={overlayStyle} />

      {/* Content */}
      <div className="relative z-10 mt-auto w-full">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 pb-[clamp(48px,7vw,84px)]">
          <div className="max-w-[660px]">
            <h1 className="mb-5 text-[clamp(38px,5.6vw,68px)] font-bold leading-[1.04] tracking-tight text-white">
              {heading}
            </h1>
            {description && (
              <p className="mb-7 max-w-[46ch] text-[clamp(15px,1.6vw,17px)] leading-relaxed text-white/80">
                {description}
              </p>
            )}
            {treks && <SearchBar treks={treks} />}
          </div>
        </div>
      </div>
    </section>
  );
}