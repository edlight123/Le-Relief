import type { Metadata } from "next";
import LocalizedHomePage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/(public)/(locale)/[locale]/page";
import { LocaleProvider } from "@/hooks/useLocaleContext";

export const revalidate = 60;

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
