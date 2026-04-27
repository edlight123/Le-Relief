import { localeRedirect } from "@/lib/redirect-locale";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export default async function LegacyArticleRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return localeRedirect(`/articles/${slug}`);
}