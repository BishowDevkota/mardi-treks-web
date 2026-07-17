import { Shield, Users, Leaf, Heart, Tag, CreditCard, Map, Star, Mountain, Compass, Globe, Award, Smile, Sun } from "lucide-react";

const iconComponentMap: Record<string, React.ElementType> = {
  Shield, Users, Leaf, Heart, Tag, CreditCard,
  Map, Star, Mountain, Compass, Globe, Award, Smile, Sun,
};

const defaultIcon = Shield;

const defaultItems = [
  { icon: "Shield", title: "Safety First", description: "All our guides are certified, first-aid trained, and carry satellite communication. Your safety is our top priority." },
  { icon: "Users", title: "Expert Local Guides", description: "Our guides have decades of combined experience across Nepal's trekking regions. They know every trail intimately." },
  { icon: "Leaf", title: "Responsible Tourism", description: "We're committed to responsible travel — supporting local communities, minimizing environmental impact, and preserving Nepal's heritage." },
  { icon: "Heart", title: "Supporting Local Communities", description: "We are a purely nurtured and owned native trekking company in Nepal, giving back to the communities we explore." },
  { icon: "Tag", title: "No Hidden Charges", description: "There are no hidden charges — everything is transparent as mentioned in the itinerary, so you can plan with confidence." },
  { icon: "CreditCard", title: "We Cater to All Budgets", description: "Our custom modification options help trekkers of all budget types find the perfect adventure experience." },
];

const iconColors = ["text-primary", "text-secondary", "text-success", "text-primary", "text-secondary", "text-success"];

export function WhyChooseUs({
  subtitle,
  heading,
  items,
  bgImage,
}: {
  subtitle?: string | null;
  heading?: string | null;
  items?: { icon: string; title: string; description: string }[] | null;
  bgImage?: string | null;
}) {
  const resolvedItems = items && items.length > 0 ? items : defaultItems;
  const resolvedBg = bgImage || "/images/home/why-choose-us-bg.png";

  return (
    <section
      className="relative bg-background bg-cover bg-center bg-no-repeat py-16 sm:py-24"
      style={{ backgroundImage: `url('${resolvedBg}')` }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-background/80" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Subtitle with decorative line */}
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-secondary" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            {subtitle || "Discover the Difference"}
          </span>
        </div>

        {/* Heading */}
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {heading || "Why Trek With Us?"}
        </h2>

        {/* Grid */}
        <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedItems.map((item, index) => {
            const Icon = iconComponentMap[item.icon] || defaultIcon;
            const colorClass = iconColors[index % iconColors.length];
            return (
              <div key={item.title} className="flex items-start gap-5">
                <div className="flex h-14 w-14 min-w-14 items-center justify-center rounded-2xl bg-surface shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)]">
                  <Icon className={`h-6 w-6 ${colorClass}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
