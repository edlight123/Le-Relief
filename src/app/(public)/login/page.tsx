import { localeRedirect } from "@/lib/redirect-locale";

export default async function LoginRedirect() {
  await localeRedirect("/login");
}