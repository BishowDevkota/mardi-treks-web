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

  // Trek: Everest Base Camp
  await prisma.trek.upsert({
    where: { slug: "everest-base-camp" },
    update: {},
    create: {
      title: "Everest Base Camp Trek", slug: "everest-base-camp",
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
    update: {},
    create: {
      title: "Annapurna Circuit Trek", slug: "annapurna-circuit",
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
    update: {},
    create: {
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

  console.log("\n🎉 Done!");
  console.log("Admin URL:  http://localhost:3000/admin");
  console.log("Admin:      admin@marditreks.com / admin123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
