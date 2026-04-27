import { localeRedirect } from "@/lib/redirect-locale";

export default async function LegacyCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return localeRedirect(`/categories/${slug}`);
}