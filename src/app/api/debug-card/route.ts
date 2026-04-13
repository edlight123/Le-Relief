import { NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { format } from "date-fns";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const rawLatest = await articlesRepo.getPublishedArticles(1);
    const article = rawLatest[0];
    if (article) {
      const author = article.authorId ? await usersRepo.getUser(article.authorId as string) : null;
      const category = article.categoryId ? await categoriesRepo.getCategory(article.categoryId as string) : null;

      results.rawArticle = article;
      results.publishedAtType = typeof article.publishedAt;
      results.publishedAtValue = article.publishedAt;

      // Test date formatting (this is what ArticleCard does)
      try {
        const dateObj = new Date(article.publishedAt as string);
        results.dateObj = dateObj.toISOString();
        const formatted = format(dateObj, "MMM d, yyyy");
        results.formattedDate = formatted;
      } catch (e: unknown) {
        results.dateError = (e as Error).message;
      }

      // Test the full article card props
      try {
        const cardProps = {
          title: article.title as string,
          slug: article.slug as string,
          excerpt: article.excerpt as string | null,
          coverImage: article.coverImage as string | null,
          publishedAt: article.publishedAt as string | null,
          author: author ? { name: author.name as string | null } : null,
          category: category ? { name: category.name as string, slug: category.slug as string } : null,
        };
        results.cardProps = cardProps;
        results.propsOk = true;
      } catch (e: unknown) {
        results.propsError = (e as Error).message;
      }
    } else {
      results.noArticles = true;
    }
  } catch (e: unknown) {
    results.fetchError = (e as Error).message;
  }

  return NextResponse.json(results);
}
