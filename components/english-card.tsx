"use client";

import { useEffect, useState } from "react";
import { PlayButton } from "@/components/play-button";
import { useLocale } from "@/lib/locale";

type Translation = {
  source: string;
  text: string;
  error: string;
};

export function EnglishCard({ source }: { source: string }) {
  const { t } = useLocale();
  const [translation, setTranslation] = useState<Translation>({ source: "", text: "", error: "" });
  const current = source.trim();
  const matched = translation.source === current ? translation : null;

  useEffect(() => {
    if (!current) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: current }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = (await response.json()) as { english?: string; error?: string };
          if (!response.ok) throw new Error(payload.error || "英文翻译暂时不可用。");
          return payload.english ?? "";
        })
        .then((text) => {
          setTranslation({ source: current, text, error: "" });
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          const message = reason instanceof Error ? reason.message : "英文翻译暂时不可用。";
          setTranslation({ source: current, text: "", error: message });
        });
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [current]);

  const text = matched?.text ?? "";
  const error = matched?.error ?? "";
  const pending = Boolean(current) && !matched;

  return (
    <section className="border-t border-line py-8">
      <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.english}</h2>
      <p className="mb-5 text-muted">{t.englishHint}</p>
      <p className="min-h-16 whitespace-pre-wrap text-lg">{text || (pending ? t.translating : "…")}</p>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <div className="mt-4">
        <PlayButton text={text} lang="en-US" label={t.playEnglish} />
      </div>
    </section>
  );
}
