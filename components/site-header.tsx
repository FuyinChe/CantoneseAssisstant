"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteHome, siteUrl } from "@/lib/site";
import { useLocale } from "@/lib/locale";

const shell = "mx-auto w-[min(880px,calc(100%-32px))]";

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const host = siteUrl.replace(/^https:\/\//, "");
  const links = [
    { href: "/", label: t.convert },
    { href: "/learn", label: t.phrases },
    { href: "/about", label: t.about },
  ];

  return (
    <header className={`${shell} pt-7`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <a href={siteHome} className="flex items-baseline gap-2.5">
          <span className="font-serif text-[1.35rem] tracking-[-0.03em] text-foreground">LearnLanguage</span>
          <span className="text-[0.82rem] text-muted">.net</span>
        </a>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav className="flex flex-wrap gap-x-[18px] gap-y-2 text-[0.92rem]" aria-label={t.navLabel}>
            {links.map((link) => {
              const current = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={current ? "text-foreground" : "text-muted hover:text-foreground"}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex rounded-full border border-line bg-card p-[3px]" role="group" aria-label={t.langLabel}>
            <button
              type="button"
              aria-pressed={locale === "zh"}
              className={`rounded-full px-3 py-1.5 text-[0.85rem] ${locale === "zh" ? "bg-foreground text-background" : "bg-transparent text-muted"}`}
              onClick={() => setLocale("zh")}
            >
              中文
            </button>
            <button
              type="button"
              aria-pressed={locale === "en"}
              className={`rounded-full px-3 py-1.5 text-[0.85rem] ${locale === "en" ? "bg-foreground text-background" : "bg-transparent text-muted"}`}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
      </div>
      <div className="pb-2 pt-9">
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-[1.7rem] min-w-[2.6rem] items-center justify-center rounded-full bg-accent px-[0.55rem] text-[0.72rem] font-semibold tracking-[0.06em] text-white">
            CA
          </span>
          <p className="text-[0.78rem] tracking-[0.14em] text-muted uppercase">{host}</p>
        </div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.7rem)] font-medium tracking-[-0.04em]">{t.brand}</h1>
        {locale === "zh" ? <p className="mt-2 text-muted">{t.enName}</p> : null}
      </div>
    </header>
  );
}
