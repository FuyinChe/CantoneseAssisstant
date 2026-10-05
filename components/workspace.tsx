"use client";

import { useEffect, useState } from "react";
import { EnglishCard } from "@/components/english-card";
import { JyutpingLine } from "@/components/jyutping-line";
import { PinyinLine } from "@/components/pinyin-line";
import { ZhuyinLine } from "@/components/zhuyin-line";
import { OcrPanel } from "@/components/ocr-panel";
import { PlayButton } from "@/components/play-button";
import { StrokeSheet } from "@/components/stroke-sheet";
import { convertText } from "@/lib/convert";
import { glyphMarks } from "@/lib/glyphs";
import { useLocale } from "@/lib/locale";
import type { Conversion } from "@/lib/types";

const empty: Conversion = { simplified: "", traditional: "", taiwan: "", cantonese: "" };

function GlyphText({ text, marks }: { text: string; marks: boolean[] }) {
  if (!text) return <p className="min-h-16 text-lg">…</p>;
  return (
    <p className="flex min-h-16 flex-wrap items-start gap-x-3 gap-y-2">
      {Array.from(text).map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={
            marks[index]
              ? "rounded-sm bg-accent-soft px-0.5 text-lg leading-none text-accent"
              : "px-0.5 text-lg leading-none"
          }
        >
          {char}
        </span>
      ))}
    </p>
  );
}

function GlyphComparison({ result }: { result: Conversion }) {
  const { t } = useLocale();
  const [hongKongMarks = [], taiwanMarks = [], simplifiedMarks = []] = glyphMarks([
    result.traditional,
    result.taiwan,
    result.simplified,
  ]);

  return (
    <section className="border-t border-line py-8">
      <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.glyphs}</h2>
      <p className="text-muted">{t.glyphsHint}</p>
      <div className="mt-6 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-medium">{t.hongKong}</h3>
            <StrokeSheet text={result.traditional} />
          </div>
          <p className="text-muted">{t.hongKongHint}</p>
          <GlyphText text={result.traditional} marks={hongKongMarks} />
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-8">
          <h3 className="text-lg font-medium">{t.taiwan}</h3>
          <p className="text-muted">{t.taiwanHint}</p>
          {result.taiwan ? (
            <ZhuyinLine
              key={result.taiwan}
              text={result.taiwan}
              simplified={result.simplified}
              marks={taiwanMarks}
            />
          ) : (
            <p className="min-h-16 text-lg">…</p>
          )}
          <PlayButton text={result.taiwan} lang="zh-TW" label={t.playTaiwan} />
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-8">
          <h3 className="text-lg font-medium">{t.simplified}</h3>
          <p className="text-muted">{t.simplifiedHint}</p>
          {result.simplified ? (
            <PinyinLine key={result.simplified} text={result.simplified} marks={simplifiedMarks} />
          ) : (
            <p className="min-h-16 text-lg">…</p>
          )}
          <PlayButton text={result.simplified} lang="zh-CN" label={t.playMandarin} />
        </div>
      </div>
    </section>
  );
}

export function Workspace() {
  const { t } = useLocale();
  const [input, setInput] = useState("我不知道后面怎么走。");
  const [result, setResult] = useState<Conversion>(empty);

  useEffect(() => {
    let cancelled = false;
    void convertText(input).then((next) => {
      if (!cancelled) setResult(next);
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  return (
    <div className="mx-auto w-[min(880px,calc(100%-32px))]">
      <section className="border-t border-line py-8">
        <h2 id="input-heading" className="mb-3 font-serif text-[1.35rem] font-medium">{t.input}</h2>
        <p className="max-w-[40rem] text-muted">{t.inputHint}</p>
        <textarea
          id="source-text"
          aria-labelledby="input-heading"
          className="mt-5 min-h-32 w-full rounded-2xl border border-line bg-card p-4 text-lg outline-none focus:border-foreground"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.inputPlaceholder}
        />
        <div className="mt-4">
          <OcrPanel onText={setInput} />
        </div>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.cantonese}</h2>
        <p className="mb-5 text-muted">{t.cantoneseHint}</p>
        <JyutpingLine key={result.cantonese} text={result.cantonese} />
        <div className="mt-4">
          <PlayButton text={result.cantonese} lang="zh-HK" label={t.playCantonese} />
        </div>
      </section>
      <GlyphComparison result={result} />
      <EnglishCard source={result.simplified} />
    </div>
  );
}
