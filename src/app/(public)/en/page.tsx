import type { Metadata } from "next";
import LocalizedHomePage, {
  generateMetadata as generateLocalizedMetadata,
  revalidate,
} from "@/app/(public)/(locale)/[locale]/page";
import { LocaleProvider } from "@/hooks/useLocaleContext";

export { revalidate };

export async function generateMetadata(): Promise<Metadata> {
  return generateLocalizedMetadata({ params: Promise.resolve({ locale: "en" }) });
}

export default function EnglishSelectionPage() {
  return (
    <LocaleProvider locale="en">
      <LocalizedHomePage params={Promise.resolve({ locale: "en" })} />
    </LocaleProvider>
  );
}
