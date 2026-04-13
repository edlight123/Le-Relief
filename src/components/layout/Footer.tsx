import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";

export default function Footer() {
  return (
    <footer className="bg-black text-neutral-400 mt-auto relative overflow-hidden">
      {/* Colorful gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {/* Ambient orbs */}
      <div className="gradient-orb w-80 h-80 bg-purple-600 bottom-[-20%] left-[10%] opacity-[0.06]" />
      <div className="gradient-orb w-64 h-64 bg-pink-500 top-[10%] right-[5%] opacity-[0.04]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.png"
                alt="Le Relief"
                width={48}
                height={48}
                className="rounded-full ring-2 ring-primary/20"
                unoptimized
              />
              <h3 className="text-xl font-bold text-white tracking-tight">
                {siteConfig.name}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              {siteConfig.description}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-accent-rose uppercase tracking-[0.2em] mb-5">
              Navigate
            </h4>
            <ul className="space-y-3">
              {siteConfig.nav.public.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-500 hover:text-primary-light transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-accent-teal uppercase tracking-[0.2em] mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-neutral-500 hover:text-primary-light transition-colors duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-neutral-500 hover:text-primary-light transition-colors duration-300"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold text-accent-amber uppercase tracking-[0.2em] mb-5">
              Follow Us
            </h4>
            <SocialLinks />
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 text-center text-xs text-neutral-600 tracking-wide">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
