import { siteConfig } from "@/config/site.config";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { normalizeArticle, stripHtml } from "@/lib/editorial";

export const revalidate = 3600;

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const raw = await articlesRepo.getPublishedArticles(50);

  const authorIds = [...new Set(raw.map((a) => a.authorId as string).filter(Boolean))];
  const categoryIds = [...new Set(raw.map((a) => a.categoryId as string).filter(Boolean))];
  const [authorsArr, categoriesArr] = await Promise.all([
    Promise.all(authorIds.map((id) => usersRepo.getUser(id))),
    Promise.all(categoryIds.map((id) => categoriesRepo.getCategory(id))),
  ]);
  const authorMap = new Map(authorsArr.filter(Boolean).map((u) => [u!.id as string, u]));
  const categoryMap = new Map(categoriesArr.filter(Boolean).map((c) => [c!.id as string, c]));

  const articles = raw.map((a) =>
    normalizeArticle(
      a,
      authorMap.get(a.authorId as string) ?? null,
      categoryMap.get(a.categoryId as string) ?? null,
    )
  );

  const items = articles
    .map((article) => {
      const url = `${siteConfig.url}/articles/${article.slug}`;
      const description = article.excerpt
        ? escapeXml(article.excerpt)
        : article.body
        ? escapeXml(stripHtml(article.body).slice(0, 280))
        : "";
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : "";
      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${description}]]></description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${article.category ? `<category><![CDATA[${article.category.name}]]></category>` : ""}
      ${article.author ? `<dc:creator><![CDATA[${article.author.name}]]></dc:creator>` : ""}
      ${article.imageSrc ? `<enclosure url="${escapeXml(article.imageSrc)}" type="image/jpeg" length="0"/>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>fr</language>
    <copyright>${escapeXml(siteConfig.name)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteConfig.url}/logo.png</url>
      <title>${escapeXml(siteConfig.name)}</title>
      <link>${siteConfig.url}</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
