import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";

export default function Footer() {
  return (
    <footer className="bg-surface-elevated dark:bg-[#0A0A0A] text-muted mt-auto border-t border-border-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.png"
                alt="Le Relief Haiti"
                width={36}
                height={36}
                className="rounded-full"
                unoptimized
              />
              <h3 className="text-lg font-bold text-foreground">
                {siteConfig.name}
              </h3>
            </div>
            <p className="text-sm leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
              Navigate
            </h4>
            <ul className="space-y-2.5">
              {siteConfig.nav.public.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-primary transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm hover:text-primary transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm hover:text-primary transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
              Follow Us
            </h4>
            <SocialLinks />
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border-subtle text-center text-xs tracking-wide">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
