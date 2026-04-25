import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryNavigation from "@/components/public/CategoryNavigation";
import { getPublicCategories } from "@/lib/public-content";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getPublicCategories(true);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-foreground focus:px-4 focus:py-2 focus:font-label focus:text-xs focus:font-bold focus:uppercase focus:text-background"
      >
        Aller au contenu
      </a>
      <Navbar />
      <CategoryNavigation categories={categories} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
