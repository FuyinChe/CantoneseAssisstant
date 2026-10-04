"use client";

import { useEffect, useState } from "react";
import { PlayButton } from "@/components/play-button";

type Translation = {
  source: string;
  text: string;
  error: string;
};

export function EnglishCard({ source }: { source: string }) {
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
    <article className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-background px-4 py-3">
        <h2 className="text-sm font-semibold">英文</h2>
        <p className="mt-1 text-xs text-muted">按简体意思做机器翻译。句子会送到在线翻译服务。</p>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="min-h-16 text-lg">{text || (pending ? "翻译中…" : "…")}</p>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <PlayButton text={text} lang="en-US" label="英文朗读" />
      </div>
    </article>
  );
}
