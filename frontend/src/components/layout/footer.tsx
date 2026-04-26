import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  shop: [
    { label: "All Products", href: "/products" },
    { label: "Men", href: "/products?category=men" },
    { label: "Women", href: "/products?category=women" },
    { label: "Shoes", href: "/products?category=shoes" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping & Returns", href: "/contact" },
    { label: "FAQ", href: "/contact" },
    { label: "Size Guide", href: "/products" },
  ],
  company: [
    { label: "About Us", href: "/" },
    { label: "Privacy Policy", href: "/" },
    { label: "Terms of Service", href: "/" },
    { label: "Careers", href: "/" },
  ],
};

function SocialIcon({ children, href, label }: { children: React.ReactNode; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-red-500/50 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]"
    >
      {children}
    </a>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="container-shell py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-jordan.svg"
                alt="Jordan logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full shadow-[0_0_18px_rgba(220,38,38,0.3)]"
              />
              <div>
                <p className="font-display text-2xl tracking-wider leading-none text-white">JORDAN</p>
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/50">Performance Society</p>
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/50">
              Premium performance footwear engineered for game-day precision, street-level style, and everything in between.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              <SocialIcon href="https://instagram.com" label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </SocialIcon>
              <SocialIcon href="https://twitter.com" label="X / Twitter">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </SocialIcon>
              <SocialIcon href="https://youtube.com" label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.58 12 19.58 12 19.58s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.45z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>
              </SocialIcon>
              <SocialIcon href="https://tiktok.com" label="TikTok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.2V9.06a8.16 8.16 0 0 0 4.84 1.58v-3.5a4.77 4.77 0 0 1-1-.45z" /></svg>
              </SocialIcon>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-white/80">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-white/80">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-white/80">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-white/40">
            © {year} Jordan Performance Society. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-xs text-white/40">
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none"><rect width="24" height="16" rx="2" fill="#1A1F71" /><circle cx="9" cy="8" r="5" fill="#EB001B" /><circle cx="15" cy="8" r="5" fill="#F79E1B" /><path d="M12 3.8A5 5 0 0 1 14 8a5 5 0 0 1-2 4.2A5 5 0 0 1 10 8a5 5 0 0 1 2-4.2z" fill="#FF5F00" /></svg>
              Mastercard
            </span>
            <span className="flex items-center gap-2 text-xs text-white/40">
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none"><rect width="24" height="16" rx="2" fill="#1434CB" /><path d="M9.5 11.5L11 4.5h2l-1.5 7h-2zm7-7l-2 4.8-.9-4.2-.1-.6h-2l2.5 7h1.8l3.2-7h-2.5zm-10 0l-2.5 7h2l.4-1h2.4l.2 1h1.8l-1.5-7h-2.8zm.8 4.5l.8-2.3.4 2.3H7.3z" fill="white" /></svg>
              Visa
            </span>
            <span className="flex items-center gap-2 text-xs text-white/40">
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none"><rect width="24" height="16" rx="2" fill="#003087" /><path d="M8 5h2c1.1 0 2 .5 2 1.5S11.1 8 10 8H9l-.5 2.5H7L8 5zm1.3 1l-.3 1.3h.7c.5 0 .8-.3.8-.7 0-.4-.3-.6-.8-.6h-.4z" fill="#009CDE" /><path d="M13 5h2c1.1 0 2 .5 2 1.5s-.9 1.5-2 1.5h-1l-.5 2.5h-1.5L13 5zm1.3 1l-.3 1.3h.7c.5 0 .8-.3.8-.7 0-.4-.3-.6-.8-.6h-.4z" fill="#012169" /></svg>
              PayPal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
