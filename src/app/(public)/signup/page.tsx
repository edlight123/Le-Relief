import { localeRedirect } from "@/lib/redirect-locale";

export default async function SignupRedirect() {
  await localeRedirect("/signup");
}