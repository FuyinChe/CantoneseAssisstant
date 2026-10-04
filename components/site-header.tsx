import Link from "next/link";
import { siteName, siteNameEn } from "@/lib/site";

const links = [
  { href: "/", label: "转换" },
  { href: "/learn", label: "词汇" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-semibold tracking-wide text-white" aria-hidden="true">
            CA
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-semibold tracking-wide">{siteName}</span>
            <span className="text-xs text-muted">{siteNameEn}</span>
          </span>
        </Link>
        <nav className="flex gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 text-foreground hover:bg-accent-soft"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
