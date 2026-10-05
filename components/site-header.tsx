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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-[0.35rem] min-[721px]:flex min-[721px]:flex-wrap min-[721px]:gap-x-4 min-[721px]:gap-y-3">
        <a href={siteHome} className="col-start-1 row-start-1 flex min-w-0 items-baseline gap-2.5">
          <span className="font-serif text-[1.35rem] tracking-[-0.03em] text-foreground">LearnLanguage</span>
          <span className="text-[0.82rem] text-muted">.net</span>
        </a>
        <nav
          className="col-span-2 row-start-2 flex flex-wrap gap-x-[18px] gap-y-2 text-[0.92rem] min-[721px]:ml-auto"
          aria-label={t.navLabel}
        >
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
        <div
          className="col-start-2 row-start-1 inline-flex justify-self-end rounded-full border border-line bg-card p-[2px]"
          role="group"
          aria-label={t.langLabel}
        >
          <button
            type="button"
            aria-pressed={locale === "zh"}
            className={`min-h-[1.85rem] rounded-full px-[0.65rem] text-[0.78rem] leading-none max-[720px]:min-h-[1.65rem] max-[720px]:px-2 max-[720px]:text-[0.72rem] ${locale === "zh" ? "bg-accent text-white" : "bg-transparent text-muted"}`}
            onClick={() => setLocale("zh")}
          >
            中文
          </button>
          <button
            type="button"
            aria-pressed={locale === "en"}
            className={`min-h-[1.85rem] rounded-full px-[0.65rem] text-[0.78rem] leading-none max-[720px]:min-h-[1.65rem] max-[720px]:px-2 max-[720px]:text-[0.72rem] ${locale === "en" ? "bg-accent text-white" : "bg-transparent text-muted"}`}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>
      </div>
      <div className="pb-2 pt-9">
        <Link
          href="/"
          className="group mb-3 flex w-fit items-center gap-3 no-underline"
          aria-label={t.brand}
        >
          <span className="inline-flex h-[1.7rem] min-w-[2.6rem] items-center justify-center rounded-full bg-accent px-[0.55rem] text-[0.72rem] font-semibold tracking-[0.06em] text-white group-hover:opacity-90">
            CA
          </span>
          <span className="text-[0.78rem] tracking-[0.14em] text-muted uppercase group-hover:text-foreground">
            {host}
          </span>
        </Link>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.7rem)] font-medium tracking-[-0.04em]">{t.brand}</h1>
        {locale === "zh" ? <p className="mt-2 text-muted">{t.enName}</p> : null}
      </div>
    </header>
  );
}
