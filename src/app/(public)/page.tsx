import type { Metadata } from "next";
import LocalizedHomePage, {
  generateMetadata as generateLocalizedMetadata,
  revalidate,
} from "@/app/(public)/(locale)/[locale]/page";
import { LocaleProvider } from "@/hooks/useLocaleContext";

export { revalidate };

export async function generateMetadata(): Promise<Metadata> {
  return generateLocalizedMetadata({ params: Promise.resolve({ locale: "fr" }) });
}

export default function HomePage() {
  return (
    <LocaleProvider locale="fr">
      <LocalizedHomePage params={Promise.resolve({ locale: "fr" })} />
    </LocaleProvider>
  );
}
