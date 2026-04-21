import { siteConfig } from "@/config/site.config";
import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as usersRepo from "@/lib/repositories/users";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const urls: string[] = [];

  urls.push(`${siteConfig.url}/en`);
  ["about", "categories", "contact", "corrections", "privacy", "search", "traduction-ia", "login", "signup"].forEach((path) => {
    urls.push(`${siteConfig.url}/en/${path}`);
  });

  try {
    const articles = await articlesRepo.getPublishedArticles(1000, "en");
    for (const article of articles) {
      if (typeof article.slug === "string" && article.slug) {
        urls.push(`${siteConfig.url}/en/articles/${article.slug}`);
      }
    }
  } catch {
    // no-op
  }

  try {
    const categories = await categoriesRepo.getCategories();
    for (const category of categories) {
      if (typeof category.slug === "string" && category.slug) {
        urls.push(`${siteConfig.url}/en/categories/${category.slug}`);
      }
    }
  } catch {
    // no-op
  }

  try {
    const authors = await usersRepo.getUsers();
    for (const author of authors) {
      if (typeof author.id === "string") {
        urls.push(`${siteConfig.url}/en/auteurs/${author.id}`);
      }
    }
  } catch {
    // no-op
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)]
    .map((url) => `  <url><loc>${esc(url)}</loc></url>`)
    .join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
