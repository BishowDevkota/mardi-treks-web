// Server component — zero JS sent to the client. Picks a random fact at
// render time so the loading screen has content immediately with no
// hydration, no effects, no interval timers, and no icon library imports.

const FAKTS = [
  "Mardi Himal is a trekking peak standing at 5,587 metres (18,330 ft) in the Annapurna region of Nepal.",
  "The trek offers some of the most pristine and less-crowded trails in the entire Annapurna region.",
  "Mardi Himal was first ascended in 1961 by a British Royal Air Force expedition led by Colonel Jimmy Roberts.",
  "The trek provides unparalleled close-up views of Machhapuchhre (Fishtail Mountain) at 6,993 metres.",
  "Mardi Himal Base Camp sits at an altitude of 4,500 metres, offering panoramic Himalayan vistas.",
  "The trail passes through lush rhododendron forests that burst into vibrant bloom during spring (March–May).",
  "Unlike the crowded Annapurna Base Camp trek, Mardi Himal sees only a fraction of the visitors.",
  "The trek typically takes 5–7 days to complete, making it perfect for a short Himalayan adventure.",
  "From the upper ridges, trekkers can see Annapurna I (8,091 m), the 10th highest mountain on Earth.",
  "The best seasons for the Mardi Himal trek are spring (March–May) and autumn (September–November).",
  "The trek starts from Kande or Phedi, both short drives from the lakeside city of Pokhara.",
  "Teahouses along the route provide warm lodging and hearty Dal Bhat — the staple meal of Nepali trekkers.",
  "The trail offers dramatic changes in landscape — from terraced farmlands to alpine meadows and rocky moraines.",
  "Mardi Himal was only opened to trekkers in 2012, making it one of Nepal's newer trekking routes.",
  "The summit ridge at 5,100 m is the highest point reachable by trekkers without technical climbing gear.",
  "Snowfall is possible even during the main trekking seasons, especially above 3,500 metres.",
  "The name 'Mardi' is believed to derive from a local Gurung word meaning 'the one who leads'.",
  "Despite its relatively low altitude, Mardi Himal offers views comparable to much higher treks.",
  "The trek passes through traditional Gurung and Magar villages where ancient Himalayan culture thrives.",
  "On clear days, you can see five of the world's 14 highest peaks — Annapurna I, II, III, IV, and Dhaulagiri.",
];

export function Fakts() {
  const fact = FAKTS[Math.floor(Math.random() * FAKTS.length)];

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-left">
      {/* Inline SVG sparkle — no icon library import needed */}
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-primary/60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
        <path d="M18 14l1 2.5L22 18l-3 1-1 3-1-3-3-1 3-1z" />
      </svg>
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary/50">
          Did you know?
        </span>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {fact}
        </p>
      </div>
    </div>
  );
}
