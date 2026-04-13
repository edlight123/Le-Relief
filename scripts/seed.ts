/**
 * Seed script for Firestore.
 * Usage: FIREBASE_PROJECT_ID=xxx FIREBASE_CLIENT_EMAIL=xxx FIREBASE_PRIVATE_KEY=xxx npx tsx scripts/seed.ts
 */
import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

// Init Firebase
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

privateKey = privateKey.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();

async function findOrCreateUser(email: string, data: Record<string, unknown>) {
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0]!;
    console.log(`  User ${email} already exists (${doc.id})`);
    return doc.id;
  }
  const ref = db.collection("users").doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  console.log(`  Created user ${email} (${ref.id})`);
  return ref.id;
}

async function findOrCreateCategory(slug: string, data: Record<string, unknown>) {
  const snap = await db.collection("categories").where("slug", "==", slug).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0]!;
    return doc.id;
  }
  const ref = db.collection("categories").doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

async function findOrCreateArticle(slug: string, data: Record<string, unknown>) {
  const snap = await db.collection("articles").where("slug", "==", slug).limit(1).get();
  if (!snap.empty) {
    console.log(`  Article "${slug}" already exists`);
    return;
  }
  const ref = db.collection("articles").doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({ ...data, views: 0, createdAt: now, updatedAt: now });
  console.log(`  Created article "${slug}"`);
}

async function main() {
  console.log("Seeding Firestore...\n");

  // Create users
  console.log("Creating users...");
  const adminPassword = await bcrypt.hash("admin123", 12);
  const adminId = await findOrCreateUser("admin@lerelief.com", {
    name: "Admin",
    email: "admin@lerelief.com",
    hashedPassword: adminPassword,
    role: "admin",
    image: null,
    emailVerified: null,
  });

  const pubPassword = await bcrypt.hash("publisher123", 12);
  const publisherId = await findOrCreateUser("publisher@lerelief.com", {
    name: "Sarah Editor",
    email: "publisher@lerelief.com",
    hashedPassword: pubPassword,
    role: "publisher",
    image: null,
    emailVerified: null,
  });

  // Create categories
  console.log("\nCreating categories...");
  const categoryData = [
    { name: "World", slug: "world", description: "Global news and international affairs" },
    { name: "Technology", slug: "technology", description: "Tech news, innovation, and digital trends" },
    { name: "Culture", slug: "culture", description: "Arts, entertainment, and cultural commentary" },
    { name: "Business", slug: "business", description: "Economy, finance, and business intelligence" },
    { name: "Science", slug: "science", description: "Scientific discoveries and research" },
    { name: "Opinion", slug: "opinion", description: "Editorial perspectives and analysis" },
  ];

  const categoryIds: string[] = [];
  for (const cat of categoryData) {
    const id = await findOrCreateCategory(cat.slug, cat);
    categoryIds.push(id);
    console.log(`  Category "${cat.name}" (${id})`);
  }

  // Create articles
  console.log("\nCreating articles...");
  const articles = [
    {
      title: "The Future of Sustainable Energy in Global Markets",
      subtitle: "How renewable technologies are reshaping the economic landscape",
      slug: "future-sustainable-energy-global-markets",
      body: "The global energy landscape is undergoing a profound transformation. As nations commit to carbon neutrality targets, the shift toward renewable energy sources is accelerating at an unprecedented pace.\n\nSolar and wind energy costs have dropped dramatically over the past decade, making them competitive with fossil fuels in many markets. This economic reality is driving investment decisions across the energy sector.\n\nExperts predict that by 2030, renewable energy will account for more than half of global electricity generation. This transition presents both opportunities and challenges for economies worldwide.",
      excerpt: "How renewable technologies are reshaping the economic landscape and what it means for global markets.",
      coverImage: null,
      status: "published",
      featured: true,
      authorId: publisherId,
      categoryId: categoryIds[3],
      publishedAt: new Date("2026-04-10"),
    },
    {
      title: "Artificial Intelligence and the Newsroom Revolution",
      subtitle: "Examining how AI tools are changing editorial workflows",
      slug: "ai-newsroom-revolution",
      body: "Newsrooms around the world are integrating artificial intelligence into their daily operations. From automated reporting to content personalization, AI is fundamentally changing how news is produced and consumed.\n\nWhile concerns about accuracy and editorial integrity remain valid, many publications have found ways to use AI as a tool that enhances rather than replaces human journalism.",
      excerpt: "Examining how AI tools are changing editorial workflows in modern newsrooms.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: adminId,
      categoryId: categoryIds[1],
      publishedAt: new Date("2026-04-08"),
    },
    {
      title: "The Renaissance of Independent Cinema",
      subtitle: "Why small-budget films are capturing global attention",
      slug: "renaissance-independent-cinema",
      body: "Independent cinema is experiencing a remarkable resurgence. Streaming platforms have created new distribution channels, making it easier than ever for independent filmmakers to reach global audiences.\n\nThis democratization of distribution has led to a flowering of diverse voices and perspectives in cinema.",
      excerpt: "Why small-budget films are capturing global attention in the streaming era.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: publisherId,
      categoryId: categoryIds[2],
      publishedAt: new Date("2026-04-06"),
    },
    {
      title: "Quantum Computing Breakthrough Opens New Possibilities",
      slug: "quantum-computing-breakthrough",
      body: "Researchers have announced a significant breakthrough in quantum computing that could accelerate the timeline for practical quantum applications.\n\nThe achievement demonstrates quantum advantage in a real-world computational task for the first time.",
      excerpt: "New research demonstrates quantum advantage in practical applications for the first time.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: adminId,
      categoryId: categoryIds[4],
      publishedAt: new Date("2026-04-04"),
    },
    {
      title: "Global Trade Patterns Shift as New Alliances Form",
      slug: "global-trade-patterns-shift",
      body: "International trade dynamics are evolving rapidly as nations forge new economic partnerships. Traditional trade routes and alliances are being supplemented—and in some cases replaced—by emerging relationships.",
      excerpt: "How emerging partnerships are reshaping international commerce.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: publisherId,
      categoryId: categoryIds[0],
      publishedAt: new Date("2026-04-02"),
    },
  ];

  for (const article of articles) {
    await findOrCreateArticle(article.slug, article);
  }

  // Create social links
  console.log("\nCreating social links...");
  const socialLinks = [
    { platform: "twitter", url: "https://twitter.com/lerelief" },
    { platform: "facebook", url: "https://facebook.com/lerelief" },
    { platform: "instagram", url: "https://instagram.com/lerelief" },
  ];

  for (const link of socialLinks) {
    const snap = await db.collection("social_links").where("platform", "==", link.platform).limit(1).get();
    if (snap.empty) {
      const ref = db.collection("social_links").doc();
      const now = FieldValue.serverTimestamp();
      await ref.set({ ...link, createdAt: now, updatedAt: now });
      console.log(`  Created social link: ${link.platform}`);
    } else {
      console.log(`  Social link "${link.platform}" already exists`);
    }
  }

  console.log("\nSeeding complete!");
}

main().catch(console.error);
