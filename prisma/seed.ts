import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const accelerateUrl = process.env.DATABASE_URL;
if (!accelerateUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const prisma = new PrismaClient({ accelerateUrl });

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPw = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@marditreks.com" },
    update: {},
    create: { name: "Admin", email: "admin@marditreks.com", passwordHash: adminPw, role: "admin" },
  });
  console.log("✅ Admin: admin@marditreks.com / admin123");

  // Test customer
  const custPw = await hash("TestPass123!", 12);
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { name: "Test User", email: "test@example.com", passwordHash: custPw, role: "customer" },
  });
  console.log("✅ Customer: test@example.com / TestPass123!");

  // Site settings
  await prisma.siteSetting.upsert({
    where: { id: "site-settings" },
    update: {},
    create: {
      id: "site-settings", siteName: "Mardi Treks",
      tagline: "Premier Trekking & Tour Agency in Nepal",
      email: "info@marditreks.com", phone: "+977-1-4XXXXXX",
      address: "Thamel, Kathmandu, Nepal",
      description: "Experience the Himalayas with Mardi Treks.",
      navigation: JSON.stringify([
        { label: "Treks", href: "/treks" }, { label: "Blog", href: "/blog" },
        { label: "About", href: "/about" }, { label: "Contact", href: "/contact" },
      ]),
      socialLinks: JSON.stringify([
        { platform: "Facebook", url: "https://facebook.com/marditreks" },
        { platform: "Instagram", url: "https://instagram.com/marditreks" },
      ]),
    },
  });
  console.log("✅ Site settings");

  // Categories
  const treksCat = await prisma.category.upsert({
    where: { slug: "treks" },
    update: {},
    create: { name: "Treks", slug: "treks", icon: "🏔️", description: "Himalayan trekking packages", sort: 1, status: "published" },
  });
  await prisma.category.upsert({
    where: { slug: "tours" },
    update: {},
    create: { name: "Tours", slug: "tours", icon: "🚌", description: "Guided sightseeing tours", sort: 2, status: "published" },
  });
  await prisma.category.upsert({
    where: { slug: "climbing" },
    update: {},
    create: { name: "Climbing", slug: "climbing", icon: "⛰️", description: "Peak climbing expeditions", sort: 3, status: "published" },
  });
  console.log("✅ Categories");

  // Trek: Everest Base Camp
  await prisma.trek.upsert({
    where: { slug: "everest-base-camp" },
    update: { categoryId: treksCat.id },
    create: {
      title: "Everest Base Camp Trek", slug: "everest-base-camp", categoryId: treksCat.id,
      subtitle: "Classic Himalayan Adventure", price: 1899, duration: 14,
      difficulty: "challenging", region: "everest", maxGroupSize: 12,
      overview: "<p>The Everest Base Camp trek is the ultimate Himalayan adventure.</p>",
      heroSubtitle: "Classic Himalayan Adventure", heroBadge: "Best Seller",
      inclusions: JSON.stringify(["Airport transfers", "Flights Kathmandu-Lukla", "All meals", "Guide", "Porters", "Permits"]),
      exclusions: JSON.stringify(["International flights", "Visa", "Insurance", "Personal gear"]),
      metaTitle: "Everest Base Camp Trek - 14 Days | Mardi Treks",
      metaDescription: "Trek to Everest Base Camp with expert guides.",
      status: "published",
      highlights: { create: [
        { icon: "🏔️", text: "Stand at Everest Base Camp (5,364m)", sort: 1 },
        { icon: "🌅", text: "Sunrise from Kala Patthar (5,545m)", sort: 2 },
      ]},
      itinerary: { create: [
        { dayNumber: 1, title: "Arrive in Kathmandu", description: "Arrival and briefing.", elevation: "1,400m", accommodation: "Hotel" },
        { dayNumber: 9, title: "Everest Base Camp", description: "Trek to Gorak Shep then EBC.", elevation: "5,364m", accommodation: "Teahouse" },
        { dayNumber: 14, title: "Departure", description: "Fly home.", elevation: "-", accommodation: "-" },
      ]},
      pricingTiers: { create: [
        { groupSize: "1 person", pricePerPerson: 2399 },
        { groupSize: "2-4 people", pricePerPerson: 1899 },
      ]},
      availableDates: { create: [
        { startDate: new Date("2026-09-15"), seatsLeft: 8 },
        { startDate: new Date("2026-10-01"), seatsLeft: 5 },
      ]},
      reviews: { create: [
        { author: "Sarah M.", rating: 5, text: "Life-changing experience!", approved: true },
      ]},
      faqs: { create: [
        { question: "How fit do I need to be?", answer: "Good physical condition with regular cardio." },
        { question: "Best time?", answer: "Spring (March-May) and Autumn (September-November)." },
      ]},
    },
  });
  console.log("✅ Trek: Everest Base Camp");

  // Trek: Annapurna Circuit
  await prisma.trek.upsert({
    where: { slug: "annapurna-circuit" },
    update: { categoryId: treksCat.id },
    create: {
      title: "Annapurna Circuit Trek", slug: "annapurna-circuit", categoryId: treksCat.id,
      subtitle: "Diverse Landscapes & Culture", price: 1599, duration: 16,
      difficulty: "moderate", region: "annapurna", maxGroupSize: 14,
      overview: "<p>One of the world's classic treks.</p>",
      heroSubtitle: "Diverse Landscapes", heroBadge: "Popular",
      inclusions: JSON.stringify(["All permits", "Guide", "Accommodation", "Meals"]),
      exclusions: JSON.stringify(["International flights", "Insurance"]),
      status: "published",
      highlights: { create: [
        { icon: "⛰️", text: "Cross Thorong La Pass (5,416m)", sort: 1 },
      ]},
      pricingTiers: { create: [
        { groupSize: "1 person", pricePerPerson: 1999 },
        { groupSize: "2-4 people", pricePerPerson: 1699 },
      ]},
      availableDates: { create: [
        { startDate: new Date("2026-09-20"), seatsLeft: 10 },
        { startDate: new Date("2026-10-10"), seatsLeft: 7 },
      ]},
      reviews: { create: [
        { author: "Mike R.", rating: 5, text: "Incredible trek!", approved: true },
      ]},
    },
  });
  console.log("✅ Trek: Annapurna Circuit");

  // Trek: Mardi Himal
  await prisma.trek.upsert({
    where: { slug: "mardi-himal-trek" },
    update: { categoryId: treksCat.id },
    create: { categoryId: treksCat.id,
      title: "Mardi Himal Trek", slug: "mardi-himal-trek",
      subtitle: "Off the Beaten Path", price: 1199, duration: 10,
      difficulty: "moderate", region: "annapurna", maxGroupSize: 10,
      overview: "<p>A hidden gem in the Annapurna region.</p>",
      heroSubtitle: "Off the Beaten Path",
      inclusions: JSON.stringify(["Guide", "Permits", "Accommodation", "Meals"]),
      exclusions: JSON.stringify(["Flights", "Insurance"]),
      status: "published",
      highlights: { create: [
        { icon: "🌲", text: "Forest campsites", sort: 1 },
      ]},
      pricingTiers: { create: [
        { groupSize: "1 person", pricePerPerson: 1499 },
        { groupSize: "2-4 people", pricePerPerson: 1199 },
      ]},
      availableDates: { create: [
        { startDate: new Date("2026-10-05"), seatsLeft: 6 },
      ]},
      reviews: { create: [
        { author: "Anna L.", rating: 5, text: "Beautiful hidden trail!", approved: true },
      ]},
    },
  });
  console.log("✅ Trek: Mardi Himal");

  // Trek availability
  for (const slug of ["everest-base-camp", "annapurna-circuit", "mardi-himal-trek"]) {
    for (const dateStr of ["2026-09-15", "2026-10-01", "2026-10-20", "2026-11-05"]) {
      await prisma.trekAvailability.upsert({
        where: { trekSlug_startDate: { trekSlug: slug, startDate: new Date(dateStr) } },
        update: {},
        create: { trekSlug: slug, startDate: new Date(dateStr), seatsTotal: 12, seatsBooked: 0 },
      });
    }
  }
  console.log("✅ Trek availability");

  // Blog posts for SEO
  const blogPosts = [
    {
      title: "Everest Base Camp Trek: The Ultimate Packing List for 2026",
      slug: "everest-base-camp-packing-list-2026",
      author: "Admin",
      excerpt: "Everything you need to pack for your Everest Base Camp trek. From clothing and gear to toiletries and first aid, this comprehensive packing list covers it all.",
      content: "<p>Packing for Everest Base Camp requires careful planning. The weather can vary dramatically from the start to the end of your trek, and being prepared makes all the difference.</p><h2>Essential Clothing</h2><p>Layering is key. Start with a moisture-wicking base layer, add an insulating mid-layer like a fleece or down jacket, and top it off with a waterproof outer shell.</p><h2>Footwear</h2><p>Invest in quality trekking boots that are well broken-in. You'll also need camp shoes or sandals for the evenings.</p><h2>Gear & Equipment</h2><p>A good sleeping bag rated to -10°C, trekking poles, a headlamp with extra batteries, and a reusable water bottle with purification tablets are essential.</p>",
      tags: JSON.stringify(["trekking", "packing-list", "everest", "gear"]),
      status: "published",
      metaTitle: "Everest Base Camp Packing List 2026 | Mardi Treks",
      metaDescription: "Complete packing list for Everest Base Camp trek. Includes clothing, gear, toiletries, and essential items recommended by expert guides.",
    },
    {
      title: "Best Time to Trek in Nepal: A Seasonal Guide for 2026-2027",
      slug: "best-time-to-trek-nepal-seasonal-guide",
      author: "Admin",
      excerpt: "Discover the best seasons for trekking in Nepal. From spring rhododendron blooms to autumn clear skies, find the perfect time for your Himalayan adventure.",
      content: "<p>Nepal's trekking seasons are divided into distinct periods, each offering a unique experience. Choosing the right time can make or break your trek.</p><h2>Spring (March-May)</h2><p>Spring is one of the most popular trekking seasons. The weather is warm, the skies are clear, and the rhododendron forests are in full bloom. Temperatures at lower elevations are pleasant, though higher passes may still have snow.</p><h2>Autumn (September-November)</h2><p>Autumn is considered the peak season for trekking. After the monsoon, the air is clear, offering spectacular mountain views. The weather is stable and temperatures are comfortable at all elevations.</p><h2>Winter (December-February)</h2><p>Winter trekking is for the adventurous. Higher passes may be snowed in, but lower elevation treks like the Mardi Himal or Ghorepani Poon Hill are still accessible.</p>",
      tags: JSON.stringify(["trekking", "seasonal-guide", "nepal", "planning"]),
      status: "published",
      metaTitle: "Best Time to Trek in Nepal 2026-2027 | Seasonal Guide | Mardi Treks",
      metaDescription: "Complete guide to Nepal's trekking seasons. Find the best time for your Himalayan trek with expert advice on weather, crowds, and trail conditions.",
    },
    {
      title: "Annapurna Circuit vs Everest Base Camp: Which Trek Should You Choose?",
      slug: "annapurna-circuit-vs-everest-base-camp-comparison",
      author: "Admin",
      excerpt: "Can't decide between the Annapurna Circuit and Everest Base Camp? Compare difficulty, duration, scenery, and costs to find the perfect trek for your adventure.",
      content: "<p>Two of Nepal's most iconic treks — the Annapurna Circuit and Everest Base Camp — offer vastly different experiences. Here's how they compare.</p><h2>Difficulty</h2><p>Both treks are challenging but achievable for fit beginners. EBC reaches higher altitude (5,364m at Base Camp, 5,545m at Kala Patthar) while the Annapurna Circuit crosses Thorong La Pass at 5,416m.</p><h2>Duration</h2><p>The Annapurna Circuit typically takes 14-18 days, while EBC takes 12-16 days depending on your itinerary.</p><h2>Scenery & Diversity</h2><p>The Annapurna Circuit offers incredible diversity — from subtropical forests to high alpine deserts. EBC is more singularly focused on the goal of reaching the base of the world's highest mountain.</p>",
      tags: JSON.stringify(["trekking", "comparison", "annapurna", "everest"]),
      status: "published",
      metaTitle: "Annapurna Circuit vs Everest Base Camp: Complete Comparison | Mardi Treks",
      metaDescription: "Compare Annapurna Circuit and Everest Base Camp treks: difficulty, duration, cost, scenery, and more. Find the right trek for your Nepal adventure.",
    },
    {
      title: "Nepal Trekking Permits Guide 2026: TIMS, National Park Fees & More",
      slug: "nepal-trekking-permits-guide-2026",
      author: "Admin",
      excerpt: "Everything you need to know about trekking permits in Nepal. TIMS cards, national park entry fees, and special permits for restricted areas explained clearly.",
      content: "<p>Understanding Nepal's trekking permit system is essential for any trekker. Here's a comprehensive guide to the permits you'll need.</p><h2>TIMS Card</h2><p>The Trekkers' Information Management System (TIMS) card is required for most trekking routes. It costs approximately $20 for individual trekkers and $10 for group trekkers.</p><h2>National Park Entry Fees</h2><p>Entry fees vary by park. Sagarmatha National Park (EBC) costs approximately $30 per person, while Annapurna Conservation Area costs about $25.</p><h2>Restricted Area Permits</h2><p>Some regions like Upper Mustang, Dolpo, and Manaslu require special restricted area permits that cost $50-500 per week depending on the region.</p>",
      tags: JSON.stringify(["trekking", "permits", "guide", "planning", "nepal"]),
      status: "published",
      metaTitle: "Nepal Trekking Permits Guide 2026 | TIMS & Park Fees | Mardi Treks",
      metaDescription: "Complete guide to Nepal trekking permits. TIMS cards, national park fees, and restricted area permits explained. Plan your trek with confidence.",
    },
    {
      title: "Altitude Sickness on Treks: Prevention, Symptoms & Treatment",
      slug: "altitude-sickness-prevention-treatment-guide",
      author: "Admin",
      excerpt: "Learn how to prevent and recognize altitude sickness on your Nepal trek. Expert advice on acclimatization, symptoms to watch for, and when to descend.",
      content: "<p>Altitude sickness (Acute Mountain Sickness or AMS) is a concern for any trekker heading above 2,500m. Understanding it is crucial for a safe trek.</p><h2>What is Altitude Sickness?</h2><p>AMS occurs when your body doesn't get enough oxygen due to high altitude. It can affect anyone regardless of age, fitness, or trekking experience.</p><h2>Prevention</h2><p>The best prevention is gradual ascent. The golden rule is to not increase your sleeping altitude by more than 300-500m per day above 3,000m. Climb high, sleep low.</p><h2>Symptoms to Watch For</h2><p>Headache, nausea, dizziness, fatigue, and difficulty sleeping are common mild symptoms. If symptoms worsen or you develop confusion, loss of coordination, or shortness of breath at rest, descend immediately.</p>",
      tags: JSON.stringify(["trekking", "health", "altitude-sickness", "safety"]),
      status: "published",
      metaTitle: "Altitude Sickness Guide: Prevention, Symptoms & Treatment | Mardi Treks",
      metaDescription: "Expert guide to preventing and treating altitude sickness on Nepal treks. Learn symptoms, acclimatization tips, and when to descend safely.",
    },
  ];

  // Insert blog posts
  for (const post of blogPosts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      await prisma.blogPost.update({ where: { slug: post.slug }, data: { ...post, heroImage: null, publishedDate: new Date("2026-01-01") } });
    } else {
      await prisma.blogPost.create({ data: { ...post, heroImage: null, publishedDate: new Date("2026-01-01") } });
    }
  }
  console.log("✅ Blog posts (SEO content)");

  console.log("\n🎉 Done!");
  console.log("Admin URL:  http://localhost:3000/admin");
  console.log("Admin:      admin@marditreks.com / admin123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
