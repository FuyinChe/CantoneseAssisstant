"use client";

import { siteFamilyRepo } from "@/lib/site";
import { useLocale } from "@/lib/locale";

export function SiteFooter() {
  const { t, familyNav } = useLocale();

  return (
    <footer className="mt-14 border-t border-line">
      <div className="mx-auto flex w-[min(880px,calc(100%-32px))] flex-wrap items-center justify-between gap-x-7 gap-y-3.5 py-5 text-[0.92rem] text-muted">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label={t.pagesLabel}>
          {familyNav.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
          <a href={siteFamilyRepo} aria-label="GitHub" title={siteFamilyRepo} className="ml-1 inline-flex text-foreground">
            <svg viewBox="0 0 16 16" className="h-[18px] w-[18px]" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.7 7.7 0 0 1 8 3.47c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>
        </nav>
        <span className="text-[0.85rem]">{t.copyright}</span>
      </div>
    </footer>
  );
}
