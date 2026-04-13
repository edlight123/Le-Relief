import { NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const featured = await articlesRepo.getFeaturedArticle();
    results.getFeaturedArticle = { status: "ok", data: featured };
  } catch (e: unknown) {
    const err = e as Error;
    results.getFeaturedArticle = { status: "error", message: err.message };
  }

  try {
    const published = await articlesRepo.getPublishedArticles(6);
    results.getPublishedArticles = { status: "ok", count: published.length };
  } catch (e: unknown) {
    const err = e as Error;
    results.getPublishedArticles = { status: "error", message: err.message };
  }

  try {
    const categories = await categoriesRepo.getCategoriesWithCounts(true);
    results.getCategoriesWithCounts = { status: "ok", count: categories.length };
  } catch (e: unknown) {
    const err = e as Error;
    results.getCategoriesWithCounts = { status: "error", message: err.message };
  }

  return NextResponse.json(results);
}
