import { siteNameEn, siteYear } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted">
        Copyright © {siteYear} {siteNameEn}
      </div>
    </footer>
  );
}
