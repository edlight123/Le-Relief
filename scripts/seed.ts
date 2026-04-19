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
    await doc.ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
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
    await doc.ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    return doc.id;
  }
  const ref = db.collection("categories").doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

async function findOrCreateArticle(
  slug: string,
  data: Record<string, unknown>,
): Promise<string> {
  const snap = await db.collection("articles").where("slug", "==", slug).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0]!;
    await doc.ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    console.log(`  Updated article "${slug}"`);
    return doc.id;
  }
  const ref = db.collection("articles").doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({ ...data, views: 0, createdAt: now, updatedAt: now });
  console.log(`  Created article "${slug}"`);
  return ref.id;
}

async function main() {
  console.log("Seeding Firestore...\n");

  // Create users
  console.log("Creating users...");
  const adminPassword = await bcrypt.hash("admin123", 12);
  const adminId = await findOrCreateUser("admin@lerelief.com", {
    name: "Rédaction Le Relief",
    email: "admin@lerelief.com",
    hashedPassword: adminPassword,
    role: "admin",
    image: null,
    emailVerified: null,
    roleFr: "Direction éditoriale",
    bioFr:
      "La rédaction coordonne la hiérarchie éditoriale, la vérification et les dossiers de Le Relief.",
  });

  const pubPassword = await bcrypt.hash("publisher123", 12);
  const publisherId = await findOrCreateUser("publisher@lerelief.com", {
    name: "Nadia Jean",
    email: "publisher@lerelief.com",
    hashedPassword: pubPassword,
    role: "publisher",
    image: null,
    emailVerified: null,
    roleFr: "Éditrice",
    bioFr:
      "Nadia Jean suit les questions de société, de gouvernance et de diaspora pour Le Relief.",
  });

  // Create categories
  console.log("\nCreating categories...");
  const categoryData = [
    {
      name: "Politique",
      slug: "politique",
      description: "Institutions, gouvernance et rapports de force en Haïti.",
    },
    {
      name: "Économie",
      slug: "economie",
      description: "Finances publiques, marchés, entreprises et emploi.",
    },
    {
      name: "Société",
      slug: "societe",
      description: "Sécurité, justice, éducation, santé et vie quotidienne.",
    },
    {
      name: "Culture",
      slug: "culture",
      description: "Arts, mémoire, littérature, musique et conversations culturelles.",
    },
    {
      name: "International",
      slug: "international",
      description: "Regards régionaux et mondiaux sur les enjeux haïtiens.",
    },
    {
      name: "Opinion",
      slug: "opinion",
      description: "Points de vue clairement distingués de l'actualité.",
    },
    {
      name: "Analyse",
      slug: "analyse",
      description: "Contexte et lectures approfondies des sujets publics.",
    },
    {
      name: "Dossiers",
      slug: "dossiers",
      description: "Séries et formats longs suivis dans la durée.",
    },
  ];

  const categoryIds: string[] = [];
  for (const cat of categoryData) {
    const id = await findOrCreateCategory(cat.slug, cat);
    categoryIds.push(id);
    console.log(`  Category "${cat.name}" (${id})`);
  }

  // Create articles
  console.log("\nCreating articles...");
  const featuredSlug = "hierarchie-information-crise-prolongee";
  const featuredEnSlug = "information-hierarchy-prolonged-crisis";
  const featuredId = await findOrCreateArticle(featuredSlug, {
    title: "Pourquoi la hiérarchie de l'information compte dans une crise prolongée",
    subtitle: "Mettre les faits en ordre est déjà un acte de service public",
    slug: featuredSlug,
    body: "Dans une crise prolongée, l'information circule vite, mais elle ne se comprend pas toujours au même rythme. Le rôle d'une rédaction n'est pas seulement d'ajouter des articles au flux: il est de donner une hiérarchie, de distinguer l'urgence de la profondeur et de rappeler ce qui est établi.\n\nCette méthode aide le lecteur à repérer ce qui change réellement dans la vie publique. Elle oblige aussi le média à dire clairement s'il publie une actualité, une analyse, une opinion ou un éditorial.\n\nPour Le Relief, cette hiérarchie est une promesse de lisibilité. Elle sert les lecteurs en Haïti, la diaspora et les observateurs internationaux qui ont besoin d'une lecture fiable du pays.",
    excerpt: "Mettre les faits en ordre aide les lecteurs à distinguer l'urgence, le contexte et les responsabilités publiques.",
    coverImage: null,
    status: "published",
    featured: true,
    authorId: publisherId,
    categoryId: categoryIds[6],
    contentType: "analyse",
    language: "fr",
    translationStatus: "published",
    isCanonicalSource: true,
    alternateLanguageSlug: featuredEnSlug,
    allowTranslation: true,
    translationPriority: "élevée",
    publishedAt: new Date("2026-04-10"),
  });

  const articles = [
    {
      title: "Ce que la diaspora attend d'un média haïtien accessible à l'international",
      subtitle: "La traduction ne suffit pas sans contexte éditorial",
      slug: "diaspora-media-haitien-international",
      body: "La diaspora ne cherche pas seulement une traduction mot à mot des nouvelles venues d'Haïti. Elle cherche un accès fiable aux enjeux, aux institutions, aux débats et aux conséquences concrètes des décisions publiques.\n\nUne couche anglaise utile doit donc sélectionner les contenus qui ont une portée plus large: analyses politiques, dossiers économiques, grands sujets de société et éditoriaux majeurs.\n\nCette approche protège la qualité éditoriale. Elle évite de créer un miroir anglais impossible à maintenir et concentre les efforts sur les articles qui peuvent vraiment circuler au-delà du lectorat francophone.",
      excerpt: "L'anglais doit fonctionner comme une sélection éditoriale, pas comme un miroir automatique du site français.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: adminId,
      categoryId: categoryIds[4],
      contentType: "dossier",
      language: "fr",
      translationStatus: "not_started",
      isCanonicalSource: true,
      allowTranslation: true,
      translationPriority: "élevée",
      publishedAt: new Date("2026-04-08"),
    },
    {
      title: "Budget public: lire les chiffres sans perdre le contexte",
      subtitle: "Les données économiques doivent être expliquées, pas seulement publiées",
      slug: "budget-public-chiffres-contexte",
      body: "Un chiffre isolé peut impressionner sans éclairer. Pour comprendre une décision budgétaire, il faut regarder la source, l'échelle, la période concernée et les effets attendus sur les services publics.\n\nLe travail éditorial consiste à rendre ces éléments lisibles. Il doit aussi signaler ce qui manque: données absentes, méthode floue, calendrier incomplet ou promesse sans mécanisme d'exécution.\n\nCette discipline permet d'éviter deux pièges: dramatiser sans preuve ou banaliser une décision importante.",
      excerpt: "Les données économiques gagnent en valeur lorsqu'elles sont reliées aux services publics et aux choix de gouvernance.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: publisherId,
      categoryId: categoryIds[1],
      contentType: "analyse",
      language: "fr",
      translationStatus: "not_started",
      isCanonicalSource: true,
      allowTranslation: true,
      translationPriority: "moyenne",
      publishedAt: new Date("2026-04-06"),
    },
    {
      title: "Écoles, familles et sécurité: le quotidien sous pression",
      slug: "ecoles-familles-securite-quotidien",
      body: "Les enjeux de sécurité ne se mesurent pas seulement par les communiqués officiels. Ils se lisent aussi dans l'organisation des familles, les trajets vers l'école, les horaires de travail et les décisions que chacun prend pour réduire les risques.\n\nUne couverture responsable doit garder cette dimension humaine sans perdre l'exigence factuelle. Elle doit distinguer les témoignages, les tendances observées et les données vérifiables.\n\nC'est à cette condition que l'actualité sociale peut rester utile au lecteur.",
      excerpt: "La sécurité se comprend aussi dans les gestes ordinaires des familles, des élèves et des travailleurs.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: publisherId,
      categoryId: categoryIds[2],
      contentType: "actualite",
      language: "fr",
      translationStatus: "not_started",
      isCanonicalSource: true,
      allowTranslation: false,
      publishedAt: new Date("2026-04-04"),
    },
    {
      title: "La mémoire culturelle comme espace public",
      slug: "memoire-culturelle-espace-public",
      body: "La culture n'est pas un supplément de fin de page. Elle organise la mémoire collective, donne des mots aux ruptures et crée des espaces où une société peut se raconter autrement.\n\nTraiter la culture comme une rubrique centrale permet de mieux comprendre les débats d'identité, de langue, de transmission et de création.\n\nPour un média haïtien, cet espace est indispensable: il relie l'actualité immédiate aux formes longues de la mémoire.",
      excerpt: "La rubrique culture donne une profondeur nécessaire aux conversations publiques.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: adminId,
      categoryId: categoryIds[3],
      contentType: "analyse",
      language: "fr",
      translationStatus: "not_started",
      isCanonicalSource: true,
      allowTranslation: false,
      publishedAt: new Date("2026-04-02"),
    },
    {
      title: "Reconstruire la confiance demande plus que des slogans",
      slug: "reconstruire-confiance-plus-que-slogans",
      body: "La confiance publique ne revient pas par décret. Elle se reconstruit par la cohérence des actes, la clarté des responsabilités et la capacité des institutions à expliquer leurs décisions.\n\nDans le débat haïtien, les mots de réforme, de transparence et de rupture reviennent souvent. Leur valeur dépend pourtant de mécanismes concrets: calendrier, ressources, contrôle et reddition de comptes.\n\nUne opinion doit donc assumer son point de vue tout en restant lisible sur ses critères.",
      excerpt: "La confiance publique se reconstruit par des mécanismes observables, pas par des formules répétées.",
      coverImage: null,
      status: "published",
      featured: false,
      authorId: publisherId,
      categoryId: categoryIds[5],
      contentType: "opinion",
      language: "fr",
      translationStatus: "not_started",
      isCanonicalSource: true,
      allowTranslation: true,
      translationPriority: "moyenne",
      publishedAt: new Date("2026-03-30"),
    },
  ];

  for (const article of articles) {
    await findOrCreateArticle(article.slug, article);
  }

  await findOrCreateArticle(featuredEnSlug, {
    title: "Why information hierarchy matters in a prolonged crisis",
    subtitle: "Ordering facts is part of public-service journalism",
    slug: featuredEnSlug,
    body: "In a prolonged crisis, information moves quickly, but understanding often takes longer. A newsroom's role is not only to add more articles to the stream. It must establish hierarchy, separate urgency from depth and state clearly what is known.\n\nThat method helps readers identify what is changing in public life. It also forces a publication to label its work clearly: news, analysis, opinion or editorial.\n\nFor Le Relief, hierarchy is a promise of readability. It serves readers in Haiti, the diaspora and international observers who need a reliable way to follow the country.",
    excerpt: "Ordering facts helps readers distinguish urgency, context and public responsibility.",
    coverImage: null,
    status: "published",
    featured: false,
    authorId: publisherId,
    categoryId: categoryIds[6],
    contentType: "analyse",
    language: "en",
    translationStatus: "published",
    isCanonicalSource: false,
    sourceArticleId: featuredId,
    alternateLanguageSlug: featuredSlug,
    allowTranslation: false,
    translationPriority: null,
    publishedAt: new Date("2026-04-11"),
  });

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
