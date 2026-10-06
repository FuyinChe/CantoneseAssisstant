"use client";

import { useEffect, useState } from "react";
import { EnglishCard } from "@/components/english-card";
import { JyutpingLine } from "@/components/jyutping-line";
import { PinyinLine } from "@/components/pinyin-line";
import { ZhuyinLine } from "@/components/zhuyin-line";
import { OcrPanel } from "@/components/ocr-panel";
import { PlayButton } from "@/components/play-button";
import { StrokeSheet } from "@/components/stroke-sheet";
import { convertText, rewriteCantonese } from "@/lib/convert";
import { glyphMarks } from "@/lib/glyphs";
import { useLocale } from "@/lib/locale";
import type { Conversion } from "@/lib/types";
import { VariantLine } from "@/components/variant-line";

const empty: Conversion = { simplified: "", traditional: "", taiwan: "", cantonese: "" };

function GlyphComparison({
  result,
  onTraditional,
}: {
  result: Conversion;
  onTraditional: (text: string) => void;
}) {
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
          <VariantLine
            key={`${result.simplified}|${result.taiwan}`}
            text={result.traditional}
            simplified={result.simplified}
            marks={hongKongMarks}
            lang="zh-HK"
            speakLabel={t.playWritten}
            chooseLabel={t.variantPick}
            onChange={onTraditional}
          />
          <PlayButton text={result.traditional} lang="zh-HK" label={t.playWritten} caption={t.playWritten} />
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
  const [input, setInput] = useState("今天天气怎么样？");
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
      <GlyphComparison
        result={result}
        onTraditional={(text) => {
          setResult((current) => ({ ...current, traditional: text }));
          void rewriteCantonese(text).then((cantonese) => {
            setResult((current) =>
              current.traditional === text ? { ...current, cantonese } : current,
            );
          });
        }}
      />
      <EnglishCard source={result.simplified} />
    </div>
  );
}
