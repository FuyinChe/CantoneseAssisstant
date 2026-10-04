"use client";

import { useEffect, useState } from "react";
import { EnglishCard } from "@/components/english-card";
import { JyutpingLine } from "@/components/jyutping-line";
import { PinyinLine } from "@/components/pinyin-line";
import { ZhuyinLine } from "@/components/zhuyin-line";
import { OcrPanel } from "@/components/ocr-panel";
import { PlayButton } from "@/components/play-button";
import { convertText } from "@/lib/convert";
import { glyphMarks } from "@/lib/glyphs";
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
  const [hongKongMarks = [], taiwanMarks = [], simplifiedMarks = []] = glyphMarks([
    result.traditional,
    result.taiwan,
    result.simplified,
  ]);

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-background px-4 py-3">
        <h2 className="text-sm font-semibold">字形</h2>
        <p className="mt-1 text-xs text-muted">香港繁体、台湾繁体、简体并排。同一位置用字不同的字会标出来。</p>
      </div>
      <div className="flex flex-col divide-y divide-line px-4">
        <div className="flex flex-col gap-3 py-5">
          <h3 className="text-sm font-semibold">香港繁体</h3>
          <p className="text-xs text-muted">只改香港用字，口头说法不变。后面会变成後面。</p>
          <GlyphText text={result.traditional} marks={hongKongMarks} />
        </div>
        <div className="flex flex-col gap-3 py-5">
          <h3 className="text-sm font-semibold">台湾繁体</h3>
          <p className="text-xs text-muted">只改台湾用字。里写成裡，台写成臺。点字听国语，多音字点注音可以改读音。</p>
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
          <PlayButton text={result.taiwan} lang="zh-TW" label="国语习惯" />
        </div>
        <div className="flex flex-col gap-3 py-5">
          <h3 className="text-sm font-semibold">简体</h3>
          <p className="text-xs text-muted">点字听普通话。多音字点下面的拼音可以改读音。</p>
          {result.simplified ? (
            <PinyinLine key={result.simplified} text={result.simplified} marks={simplifiedMarks} />
          ) : (
            <p className="min-h-16 text-lg">…</p>
          )}
          <PlayButton text={result.simplified} lang="zh-CN" label="普通话习惯" />
        </div>
      </div>
    </article>
  );
}

export function Workspace() {
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <div>
          <label className="text-sm font-medium" htmlFor="source-text">
            输入
          </label>
          <p className="mt-1 text-xs text-muted">
            直接输入，或拍照、上传图片后识别整张或拖选一块。简体、繁体都可以。图片不会上传。
          </p>
        </div>
        <textarea
          id="source-text"
          className="min-h-32 rounded-xl border border-line bg-background p-4 text-lg outline-none focus:border-accent"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="简体或繁体都可以，例如：我不知道后面怎么走。"
        />
        <OcrPanel onText={setInput} />
      </section>

      <section className="flex flex-col gap-4">
        <article className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="border-b border-line bg-background px-4 py-3">
            <h2 className="text-sm font-semibold">粤语表达</h2>
            <p className="mt-1 text-xs text-muted">点字听粤语。多音字点下面的粤拼可以改读音。</p>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <JyutpingLine key={result.cantonese} text={result.cantonese} />
            <PlayButton text={result.cantonese} lang="zh-HK" label="粤语习惯" />
          </div>
        </article>
        <GlyphComparison result={result} />
        <EnglishCard source={result.simplified} />
      </section>
    </div>
  );
}
