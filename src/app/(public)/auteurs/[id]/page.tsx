import { localeRedirect } from "@/lib/redirect-locale";

export default async function LegacyAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return localeRedirect(`/auteurs/${id}`);
}