import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@lerelief.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@lerelief.com",
      hashedPassword: adminPassword,
      role: "admin",
    },
  });

  // Create publisher
  const pubPassword = await bcrypt.hash("publisher123", 12);
  const publisher = await prisma.user.upsert({
    where: { email: "publisher@lerelief.com" },
    update: {},
    create: {
      name: "Sarah Editor",
      email: "publisher@lerelief.com",
      hashedPassword: pubPassword,
      role: "publisher",
    },
  });

  // Create categories
  const categories = await Promise.all(
    [
      { name: "World", slug: "world", description: "Global news and international affairs" },
      { name: "Technology", slug: "technology", description: "Tech news, innovation, and digital trends" },
      { name: "Culture", slug: "culture", description: "Arts, entertainment, and cultural commentary" },
      { name: "Business", slug: "business", description: "Economy, finance, and business intelligence" },
      { name: "Science", slug: "science", description: "Scientific discoveries and research" },
      { name: "Opinion", slug: "opinion", description: "Editorial perspectives and analysis" },
    ].map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );

  // Create sample articles
  const articles = [
    {
      title: "The Future of Sustainable Energy in Global Markets",
      subtitle: "How renewable technologies are reshaping the economic landscape",
      slug: "future-sustainable-energy-global-markets",
      body: "The global energy landscape is undergoing a profound transformation. As nations commit to carbon neutrality targets, the shift toward renewable energy sources is accelerating at an unprecedented pace.\n\nSolar and wind energy costs have dropped dramatically over the past decade, making them competitive with fossil fuels in many markets. This economic reality is driving investment decisions across the energy sector.\n\nExperts predict that by 2030, renewable energy will account for more than half of global electricity generation. This transition presents both opportunities and challenges for economies worldwide.\n\nThe implications extend beyond the energy sector itself. Manufacturing, transportation, agriculture, and urban planning are all being reshaped by the move toward sustainability.",
      excerpt: "How renewable technologies are reshaping the economic landscape and what it means for global markets.",
      status: "published",
      featured: true,
      views: 1247,
      authorId: publisher.id,
      categoryId: categories[3].id,
      publishedAt: new Date("2026-04-10"),
    },
    {
      title: "Artificial Intelligence and the Newsroom Revolution",
      subtitle: "Examining how AI tools are changing editorial workflows",
      slug: "ai-newsroom-revolution",
      body: "Newsrooms around the world are integrating artificial intelligence into their daily operations. From automated reporting to content personalization, AI is fundamentally changing how news is produced and consumed.\n\nWhile concerns about accuracy and editorial integrity remain valid, many publications have found ways to use AI as a tool that enhances rather than replaces human journalism.\n\nThe most successful implementations combine AI efficiency with human editorial judgment, creating workflows that are both faster and more thorough than either could achieve alone.",
      excerpt: "Examining how AI tools are changing editorial workflows in modern newsrooms.",
      status: "published",
      featured: false,
      views: 832,
      authorId: admin.id,
      categoryId: categories[1].id,
      publishedAt: new Date("2026-04-08"),
    },
    {
      title: "The Renaissance of Independent Cinema",
      subtitle: "Why small-budget films are capturing global attention",
      slug: "renaissance-independent-cinema",
      body: "Independent cinema is experiencing a remarkable resurgence. Streaming platforms have created new distribution channels, making it easier than ever for independent filmmakers to reach global audiences.\n\nThis democratization of distribution has led to a flowering of diverse voices and perspectives in cinema. Stories that might never have found an audience through traditional theatrical release are now reaching millions of viewers worldwide.\n\nThe result is a richer, more varied cinematic landscape that reflects the full diversity of human experience.",
      excerpt: "Why small-budget films are capturing global attention in the streaming era.",
      status: "published",
      featured: false,
      views: 654,
      authorId: publisher.id,
      categoryId: categories[2].id,
      publishedAt: new Date("2026-04-06"),
    },
    {
      title: "Quantum Computing Breakthrough Opens New Possibilities",
      slug: "quantum-computing-breakthrough",
      body: "Researchers have announced a significant breakthrough in quantum computing that could accelerate the timeline for practical quantum applications.\n\nThe achievement demonstrates quantum advantage in a real-world computational task for the first time, moving the technology from theoretical promise to practical utility.\n\nIndustry experts believe this development could have far-reaching implications for cryptography, drug discovery, materials science, and financial modeling.",
      excerpt: "New research demonstrates quantum advantage in practical applications for the first time.",
      status: "published",
      featured: false,
      views: 421,
      authorId: admin.id,
      categoryId: categories[4].id,
      publishedAt: new Date("2026-04-04"),
    },
    {
      title: "Global Trade Patterns Shift as New Alliances Form",
      slug: "global-trade-patterns-shift",
      body: "International trade dynamics are evolving rapidly as nations forge new economic partnerships. Traditional trade routes and alliances are being supplemented—and in some cases replaced—by emerging relationships.\n\nThese shifts reflect broader geopolitical changes and are having significant impacts on supply chains, commodity prices, and economic growth patterns around the world.",
      excerpt: "How emerging partnerships are reshaping international commerce.",
      status: "published",
      featured: false,
      views: 389,
      authorId: publisher.id,
      categoryId: categories[0].id,
      publishedAt: new Date("2026-04-02"),
    },
    {
      title: "Draft: Upcoming Analysis of Digital Privacy Trends",
      slug: "draft-digital-privacy-trends",
      body: "This article will examine the evolving landscape of digital privacy regulations and their impact on both consumers and businesses. Work in progress.",
      excerpt: "An upcoming analysis of digital privacy trends.",
      status: "draft",
      featured: false,
      views: 0,
      authorId: admin.id,
      categoryId: categories[1].id,
      publishedAt: null,
    },
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
  }

  // Social links
  for (const [platform, url] of Object.entries({
    instagram: "https://instagram.com/lerelief",
    facebook: "https://facebook.com/lerelief",
    x: "https://x.com/lerelief",
  })) {
    await prisma.socialLink.upsert({
      where: { platform },
      update: {},
      create: { platform, url },
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
