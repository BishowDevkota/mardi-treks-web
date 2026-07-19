when i calculate the price form price calculator it is good and when i and go to booking page it is ok then i click book now it is redirecting to complete payment page it is ok then i select esewa that is the only one working then it take me to payment page then there is a option to pay advance and pay full amount then i select full amount 

1. Project Context

Build a fast, SEO-optimized, fully admin-manageable website for a trekking and tour agency based in Nepal, serving both local and international customers. The site sells multi-day trek and tour packages (not flights or hotels). Every trek is presented like an e-commerce product page — hero, highlights, day-by-day itinerary, a real interactive 3D map of the route, pricing, reviews, and a booking flow — and every part of every page must be editable by a non-technical admin through a CMS, without requiring a code deploy.

Primary goals, in priority order:


Page speed and Core Web Vitals (LCP, CLS, INP) must be excellent — most traffic will come from organic search.
SEO must be built into the architecture, not bolted on afterward.
Every content component (text, images, itinerary days, pricing, highlights, FAQs) must be admin-editable via CMS.
The booking and payment flow must be reliable and secure — this is the revenue path.
The map must be a real, data-driven interactive 3D terrain map showing the actual GPS route of each trek — not an illustration.



2. Full Tech Stack

LayerChoiceReasonFrameworkNext.js 14+ (App Router), single full-stack codebaseSSR/SSG/ISR in one framework covers both SEO and performance; no separate backend service neededLanguageTypeScript throughout (frontend, API routes, CMS schema)Type safety across the whole stack, fewer runtime bugsStylingTailwind CSSSmall final CSS bundle, fast to build and maintainCMSPayload CMS (self-hosted, stores content in the same PostgreSQL database)TypeScript-native, admin UI auto-generated from schema, avoids running a second content databaseDatabasePostgreSQLRelational integrity needed for bookings, payments, and usersORMPrisma (application data) — Payload manages its own collections in the same Postgres instanceType-safe queries, clean migrationsAuthNextAuth.js (Auth.js) — credentials + Google OAuthHandles both customer login and admin session separatelyCaching / rate limitingRedis via UpstashServerless-friendly, no persistent connection required, doubles as both cache store and rate-limit storePaymentsStripe (international cards) + eSewa + Khalti (Nepal local rails)Covers both foreign trekkers and domestic customersImage storage/CDNCloudinaryAutomatic format conversion (WebP/AVIF), responsive resizing, CDN deliveryMapMapbox GL JS (react-map-gl), real terrain-DEM 3D rendering with GPX/GeoJSON route overlaysOnly major map library with proper 3D terrain support for mountainous regionsHostingVercelNative Next.js support, edge caching, zero-config ISR and preview deploysMonitoringVercel Analytics (Core Web Vitals) + Sentry (errors)Continuous visibility into both performance and reliabilityCI/CDGitHub Actions + Vercel preview deploymentsLint, type-check, test, and preview every PR before mergeE2E testingPlaywrightCovers the revenue-critical path: browse → login → book → pay


3. System Architecture

Admin panel (Payload CMS UI)
        │  publishes/edits content
        ▼
Headless CMS (Payload, same Postgres instance)
        │  fetched at build/revalidation time
        ▼
Next.js application (rendering + API routes)
   ├── Static/ISR pages: trek listings, trek detail pages, blog, homepage
   ├── SSR pages: user dashboard, booking status
   └── API routes: booking, payment webhook, auth, rate-limited endpoints
        │
        ├── PostgreSQL (via Prisma): users, bookings, payments, seat availability
        ├── Redis (Upstash): page/query cache + rate limiting
        ├── Payment gateways: Stripe / eSewa / Khalti
        ├── Cloudinary: images, galleries
        └── Mapbox GL JS: 3D terrain map, GPX/GeoJSON route per trek

Critical separation of concerns: content (CMS/Payload) and transactional data (bookings/payments/users, Prisma/Postgres) must stay in separate logical models even though they share one physical database. A booking record references a trek by CMS slug/ID; booking and payment logic never lives inside the CMS.


4. Content Model (CMS Schema)

Trek (Payload collection)
├── title, slug, price, duration, difficulty, region, maxGroupSize
├── hero: { image, subtitle, badge }
├── highlights: [ { icon, text } ]                      — repeatable, reorderable
├── overview: rich text
├── itinerary: [ { dayNumber, title, description, elevation, accommodation } ]  — repeatable block
├── mapRoute: { gpxFile or geoJsonFile, staticImageFallback }
├── inclusions: [ text ]
├── exclusions: [ text ]
├── pricingTiers: [ { groupSize, pricePerPerson } ]
├── availableDates: [ { startDate, seatsLeft } ]
├── gallery: [ image ]
├── faqs: [ { question, answer } ]
├── reviews: [ { author, rating, text, approved } ]     — admin-moderated
├── seo: { metaTitle, metaDescription, ogImage, canonicalUrl }
└── blocks: [ ordered list of section types ]           — controls page layout order

Also CMS-managed: homepage sections, navigation menu, footer, site-wide banners/announcements, blog posts.

Not CMS-managed (lives in Prisma/Postgres instead): User, Booking, Payment, SeatAvailabilityCounter — these need transactional integrity, not a content model.


5. Page Rendering Strategy

Page typeStrategyRevalidationTrek detail pagesISR60–300s, plus instant on-demand revalidation (revalidatePath) when admin publishes a changeTrek listing/homepageISR300sBlog posts, About, ContactSSGOn publishUser dashboard, booking statusSSRPer requestAdmin panelClient-rendered (Payload's own UI)N/A

All customer-facing, indexable content (trek pages, listings, blog) must be server-rendered or statically generated — never client-side-only rendering — so Google can index it properly.


6. User Flow (Login → Booking)


Land on homepage / browse trek listings
Login, sign up, or continue as guest
Select a trek package and available date
View itinerary, highlights, and the real interactive 3D map route
Enter traveler details (names, passports/IDs, contacts, group size)
Payment via Stripe, eSewa, or Khalti
Booking confirmed — email confirmation + entry in user dashboard


Decide upfront whether bookings are instant-confirm or admin-reviewed (common in trekking due to permits/guide logistics/group-size limits) — this determines how much workflow state the Booking service needs to track (pending_review, confirmed, awaiting_payment, etc.).


7. Caching Strategy (four levels — implement all four)


Page-level: ISR for trek/listing pages, SSG for static content, SSR only where per-request data is required.
Data/query-level: Redis cache for expensive/repeated Prisma queries (e.g. active package lists), invalidated on write for anything booking-critical (availability), time-expired (5 min) for anything else.
Asset-level: Cloudinary + Next.js <Image> for responsive, auto-format images; next/font for self-hosted fonts; long Cache-Control on static assets.
Edge/CDN-level: Vercel's edge network serves ISR pages automatically; explicit Cache-Control: public, s-maxage=300, stale-while-revalidate=600 headers on cacheable API routes.



8. Rate Limiting

Apply Upstash Redis sliding-window rate limiting to:


/api/auth/* — brute-force protection on login/signup
/api/booking — prevent spam bookings holding inventory
/api/payment/* — prevent payment-initiation abuse
Contact/inquiry forms — prevent spam submissions


Rate limit by IP and user ID where authenticated (IP alone is weak on shared guesthouse networks common in trekking regions, and won't stop a logged-in bad actor rotating IPs). Return HTTP 429 on limit breach.


9. SEO Requirements (non-negotiable, built in from the start)


Per-page metadata via Next.js Metadata API (title, description, Open Graph image) for every trek, blog post, and listing page.
Schema.org structured data (TouristTrip or Product type) on every trek detail page.
Auto-generated sitemap.xml (via next-sitemap), resubmitted to Google Search Console on deploy.
robots.txt allowing public pages, disallowing /admin, /dashboard, /api.
Canonical URLs on any page reachable via multiple filter/query-param combinations.
Semantic HTML: correct h1–h3 hierarchy, descriptive alt text on every image (never generic filenames or empty alt).
Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.
Internal linking between related treks/tours.
Blog/content section targeting long-tail search queries (packing lists, permit guides, seasonal guides) — genuinely useful content, not thin SEO filler.
Static fallback image of the map route for crawlers and social sharing, since crawlers won't execute the 3D map's JavaScript.



10. Real Interactive 3D Map — Implementation Requirements


Use Mapbox GL JS via react-map-gl, with terrain: { source: 'mapbox-dem', exaggeration: 1.5 } for genuine 3D elevation rendering — not a flat illustration.
Each trek's route is a real GPX or GeoJSON file with actual GPS coordinates, sourced from an actual hike, licensed OpenStreetMap data, or a GPS device carried on a guided trek. Convert GPX → GeoJSON once at upload time (server-side), not on every page load.
Store the route file in Cloudinary/S3, referenced from the trek's CMS record.
Render the route as a Source/Layer line on the map, with day-by-day markers pulled from the itinerary data.
Optionally render an elevation profile chart alongside the map using the same elevation data points.
Performance-critical: lazy-load Mapbox GL JS with next/dynamic({ ssr: false }) — it is a heavy client library and must not block initial page render or hurt LCP. Load it below the fold or behind a "View interactive map" tab, never as the hero element.
Provide the static fallback image (mentioned in Section 9) for non-JS contexts.



11. Security Requirements


Zod schema validation on every API route input, before touching the database — especially booking and payment endpoints.
CSRF protection via NextAuth's built-in handling for auth flows; same-site cookies and origin verification for custom forms.
All secrets (Stripe secret key, Cloudinary API secret, database URL) in Vercel environment variables — never committed, never exposed client-side. Only genuinely public keys (e.g. Mapbox public token, Stripe publishable key) may be client-exposed.
HTTPS enforced everywhere (automatic on Vercel).
Least-privilege database user for the application; connection pooling (Prisma's pool or PgBouncer) to avoid exhausting connections under load.
No raw card data ever stored — tokenization handled entirely by Stripe/eSewa/Khalti.
Admin panel access gated separately from customer auth, with its own role-based permissions (Payload supports this natively).



12. Scalability Notes


Vercel serverless functions auto-scale per request; no manual scaling needed at typical trekking-agency traffic volumes.
Database connection count is the real bottleneck at scale — use connection pooling once concurrent serverless invocations grow.
Do heavy processing (GPX parsing, image transforms) once at upload time, never at request time.
Continuously monitor Core Web Vitals and error rates (Vercel Analytics + Sentry) — Google's crawler can deprioritize pages that degrade in speed over time, so regressions must be caught early.



13. Testing & CI/CD


GitHub Actions on every PR: lint, tsc --noEmit type-check, unit tests (Vitest/Jest).
Vercel automatic preview deployments per PR.
Playwright E2E test covering the full critical path: browse → select trek → login → book → pay → confirmation.
Manual QA checklist before launch: mobile responsiveness, payment sandbox testing (all three gateways), CMS content editing by a non-technical test user, Core Web Vitals audit via Lighthouse.



14. Definition of Done

The build is complete when:


 Every visible piece of content on every page (text, images, itinerary, pricing, FAQs, highlights) can be edited by an admin through the CMS without a code change.
 Trek detail pages score 90+ on Lighthouse Performance and SEO audits.
 The 3D map renders a real, accurate GPS route per trek, lazy-loaded and not blocking LCP.
 Booking flow works end-to-end with all three payment gateways in sandbox/test mode.
 Rate limiting is active and verified on auth, booking, and payment endpoints.
 Sitemap, robots.txt, structured data, and metadata are present and validated (Google Rich Results Test, Search Console).
 CI pipeline passes lint, type-check, unit tests, and the Playwright E2E suite on the main branch.
 Admin and customer auth are fully separated with correct role permissions.