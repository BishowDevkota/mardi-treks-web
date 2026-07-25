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
  console.log("🌱 Seeding minimal essentials...");
  console.log("ℹ️  This seed only creates the admin user and site structure.");
  console.log("ℹ️  Add your content (treks, blog posts, pages) via the CMS admin panel at /admin.\n");

  // ── Admin user ──
  const adminPw = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@marditreks.com" },
    update: {},
    create: { name: "Admin", email: "admin@marditreks.com", passwordHash: adminPw, role: "admin" },
  });
  console.log("✅ Admin: admin@marditreks.com / admin123");

  // ── Test customer (for development/testing) ──
  const custPw = await hash("TestPass123!", 12);
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { name: "Test User", email: "test@example.com", passwordHash: custPw, role: "customer" },
  });
  console.log("✅ Customer: test@example.com / TestPass123!");

  // ── Site settings (required for the site to function) ──
  // ⚠️  Update the placeholder phone number before going live!
  await prisma.siteSetting.upsert({
    where: { id: "site-settings" },
    update: {},
    create: {
      id: "site-settings",
      siteName: "Mardi Treks",
      tagline: "Premier Trekking & Tour Agency in Nepal",
      email: "info@marditreks.com",
      phone: "+977-1-4XXXXXX", // ← Update this!
      address: "Thamel, Kathmandu, Nepal",
      description: "Experience the Himalayas with Mardi Treks.",
      navigation: JSON.stringify([
        { label: "Treks", href: "/treks" },
        { label: "Tours", href: "/tours" },
        { label: "Climbing", href: "/climbing" },
        { label: "Blog", href: "/blog" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ]),
      socialLinks: JSON.stringify([
        { platform: "facebook", url: "https://facebook.com/marditreks" },
        { platform: "instagram", url: "https://instagram.com/marditreks" },
      ]),
    },
  });
  console.log("✅ Site settings");

  // ── Categories (scaffolding — add your own treks/tours inside these) ──
  await prisma.category.upsert({
    where: { slug: "treks" },
    update: {},
    create: {
      name: "Treks", slug: "treks", icon: "🏔️",
      description: "Himalayan trekking packages",
      sort: 1, status: "published",
    },
  });
  await prisma.category.upsert({
    where: { slug: "tours" },
    update: {},
    create: {
      name: "Tours", slug: "tours", icon: "🚌",
      description: "Guided sightseeing tours",
      sort: 2, status: "published",
    },
  });
  await prisma.category.upsert({
    where: { slug: "climbing" },
    update: {},
    create: {
      name: "Climbing", slug: "climbing", icon: "⛰️",
      description: "Peak climbing expeditions",
      sort: 3, status: "published",
    },
  });
  console.log("✅ Categories (treks, tours, climbing)");

  // ── Done ──
  console.log("\n🎉 Database seeded with essentials!");
  console.log("─────────────────────────────────────");
  console.log("Admin URL:  http://localhost:3000/admin");
  console.log("Admin:      admin@marditreks.com / admin123");
  console.log("Customer:   test@example.com / TestPass123!");
  console.log("─────────────────────────────────────");
  console.log("Next steps: Add your treks, blog posts, and");
  console.log("pages through the Payload CMS admin panel.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
