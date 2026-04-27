import { localeRedirect } from "@/lib/redirect-locale";

export default async function SearchRedirect() {
  await localeRedirect("/search");
}