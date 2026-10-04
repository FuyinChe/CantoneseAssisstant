import Link from "next/link";

const links = [
  { href: "/", label: "转换" },
  { href: "/learn", label: "词汇" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-semibold tracking-wide">粤语助手</span>
          <span className="text-xs text-muted">简体说法对照粤语</span>
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
