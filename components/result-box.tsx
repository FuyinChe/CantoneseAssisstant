"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/locale";

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M15 6.5V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15H6.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M6 12.5 10 16.5 18 8" />
    </svg>
  );
}

export function ResultBox({ text, children }: { text: string; children: ReactNode }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const ready = text.trim().length > 0;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative min-h-16 rounded-2xl border border-result-line bg-result px-4 py-3.5 pr-12">
      <button
        type="button"
        className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-40"
        aria-label={copied ? t.copied : t.copyText}
        title={copied ? t.copied : t.copyText}
        disabled={!ready}
        onClick={() => {
          void copy();
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? t.copied : ""}
      </span>
      {children}
    </div>
  );
}
