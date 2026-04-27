import { headers } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SkipToContent from "@/components/layout/SkipToContent";
import { LOCALE_REQUEST_HEADER } from "@/lib/locale-routing";
import { validateLocale, type Locale } from "@/lib/locale";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerLocale = (await headers()).get(LOCALE_REQUEST_HEADER);
  const initialLocale: Locale = headerLocale && validateLocale(headerLocale) ? headerLocale : "fr";

  return (
    <>
      <SkipToContent initialLocale={initialLocale} />
      <Navbar initialLocale={initialLocale} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer initialLocale={initialLocale} />
    </>
  );
}
