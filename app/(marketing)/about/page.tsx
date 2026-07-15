import type { Metadata } from "next";
import { Mountain, Users, Shield, Heart, Award, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Mardi Treks — Nepal's premier trekking and tour agency. Discover our story, our team, and our commitment to sustainable Himalayan travel.",
};

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Every guide is wilderness first-aid certified and carries satellite communication. We never compromise on safety standards.",
  },
  {
    icon: Heart,
    title: "Community Impact",
    description:
      "We employ local guides, support village schools, and invest in community-led tourism initiatives across trekking regions.",
  },
  {
    icon: Award,
    title: "Expert Knowledge",
    description:
      "With decades of combined experience, our team knows every trail, peak, and village in Nepal's trekking regions.",
  },
  {
    icon: Globe,
    title: "Sustainable Travel",
    description:
      "We're committed to leave-no-trace principles, plastic-free treks, and carbon-offset programs for every booking.",
  },
];

const team = [
  { name: "Rajesh Gurung", role: "Founder & Lead Guide", region: "Annapurna Region" },
  { name: "Maya Sherpa", role: "Operations Manager", region: "Khumbu Region" },
  { name: "David Thapa", role: "Senior Trek Guide", region: "Langtang Region" },
  { name: "Anita Rai", role: "Customer Relations", region: "Kathmandu" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Mountain className="mx-auto h-12 w-12 text-primary-light" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            About Mardi Treks
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            We&apos;ve been helping travelers explore the Himalayas since 2008. Our mission is
            simple: create life-changing adventures while supporting the communities and
            environments that make them possible.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">Our Story</h2>
          <div className="mt-4 space-y-4 text-text leading-relaxed">
            <p>
              Mardi Treks was born from a love for the mountains and a desire to share Nepal&apos;s
              incredible trekking routes with the world. Our founder, Rajesh Gurung, grew up in
              the shadow of Mardi Himal and spent his youth exploring every trail in the region.
            </p>
            <p>
              What started as guiding small groups on his home trails has grown into a full-service
              trekking agency operating across Nepal&apos;s premier trekking regions. Today, we employ
              over 30 local guides, porters, and support staff — all from the communities we trek through.
            </p>
            <p>
              We believe that travel should be a force for good. That&apos;s why we invest 10% of our
              profits into community development projects in the regions where we operate, from
              trail maintenance to school supplies in remote mountain villages.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground">What We Stand For</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="rounded-xl border border-border bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground">Our Team</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-primary">{member.role}</p>
                <p className="text-xs text-text-muted">{member.region}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
