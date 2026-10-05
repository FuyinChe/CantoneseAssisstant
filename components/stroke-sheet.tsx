"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SheetBoxSize } from "@/lib/stroke-pdf";
import { siteName, siteNameEn, siteUrl } from "@/lib/site";
import { loadStrokes } from "@/lib/strokes";
import { TIANZI_VIEW, glyphTransform, tianziMarks } from "@/lib/tianzi";
import { useLocale } from "@/lib/locale";

const hanPattern = /\p{Script=Han}/u;
const punctPattern = /\p{P}/u;
const PRACTICE_BOXES = 5;
const SHEET_LIMIT = 40;
const COPY_LIMIT = 120;

type SheetMode = "strokes" | "copy";

function TianziMarks() {
  return (
    <>
      {tianziMarks(TIANZI_VIEW).map((mark, index) => (
        <rect
          key={index}
          x={mark.x}
          y={mark.y}
          width={mark.w}
          height={mark.h}
          className="tianzi-mark"
        />
      ))}
    </>
  );
}

function StrokeGlyph({
  strokes,
  through,
  complete = false,
  framed = false,
}: {
  strokes: string[];
  through: number;
  complete?: boolean;
  framed?: boolean;
}) {
  const transform = glyphTransform(TIANZI_VIEW);
  return (
    <svg viewBox={`0 0 ${TIANZI_VIEW} ${TIANZI_VIEW}`} className={framed ? "model-box" : "stroke-box"} aria-hidden="true">
      {framed ? (
        <rect x="0.5" y="0.5" width={TIANZI_VIEW - 1} height={TIANZI_VIEW - 1} className="practice-frame" fill="#fff" />
      ) : null}
      <TianziMarks />
      <g transform={transform}>
        {strokes.slice(0, through).map((path, index) => (
          <path key={index} d={path} fill={complete || index < through - 1 ? "#1f1a14" : "#9c3b2e"} />
        ))}
      </g>
    </svg>
  );
}

function PunctGlyph({ char }: { char: string }) {
  return (
    <svg viewBox={`0 0 ${TIANZI_VIEW} ${TIANZI_VIEW}`} className="model-box" aria-hidden="true">
      <rect x="0.5" y="0.5" width={TIANZI_VIEW - 1} height={TIANZI_VIEW - 1} className="practice-frame" fill="#fff" />
      <TianziMarks />
      <text
        x={TIANZI_VIEW / 2}
        y={TIANZI_VIEW / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={TIANZI_VIEW * 0.48}
        fill="#1f1a14"
      >
        {char}
      </text>
    </svg>
  );
}

function ModelGlyph({ char, strokes }: { char: string; strokes: string[] | null | undefined }) {
  if (strokes && strokes.length > 0) {
    return <StrokeGlyph strokes={strokes} through={strokes.length} complete framed />;
  }
  if (punctPattern.test(char)) {
    return <PunctGlyph char={char} />;
  }
  return <PracticeBox />;
}

function PracticeBox() {
  return (
    <svg className="practice-box" viewBox={`0 0 ${TIANZI_VIEW} ${TIANZI_VIEW}`} aria-hidden="true">
      <rect x="0.5" y="0.5" width={TIANZI_VIEW - 1} height={TIANZI_VIEW - 1} className="practice-frame" fill="#fff" />
      <TianziMarks />
    </svg>
  );
}

export function StrokeSheet({ text }: { text: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SheetMode>("strokes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [strokes, setStrokes] = useState<Record<string, string[] | null>>({});
  const [selected, setSelected] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [boxSize, setBoxSize] = useState<SheetBoxSize>("small");
  const requestId = useRef(0);
  const hanChars = Array.from(text).filter((char) => hanPattern.test(char));
  const copyChars = Array.from(text).filter((char) => hanPattern.test(char) || punctPattern.test(char));
  const characters = mode === "copy" ? copyChars : hanChars;
  const limit = mode === "copy" ? COPY_LIMIT : SHEET_LIMIT;
  const shown = characters.slice(0, limit);
  const truncated = characters.length > limit;
  const picks = selected.length === shown.length ? selected : shown.map(() => true);
  const selectedCount = picks.filter(Boolean).length;
  const copied = shown.flatMap((char, index) => (picks[index] ? [char] : []));

  function setAll(on: boolean) {
    setSelected(shown.map(() => on));
  }

  function toggleAt(index: number) {
    setSelected((current) => {
      const base = current.length === shown.length ? [...current] : shown.map(() => true);
      base[index] = !base[index];
      return base;
    });
  }

  async function loadStrokeData(chars: string[]) {
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setError("");
    const unique = [...new Set(chars)].filter((char) => hanPattern.test(char));
    if (unique.length === 0) {
      setLoading(false);
      return;
    }
    try {
      const loaded = await Promise.all(unique.map(async (char) => [char, await loadStrokes(char)] as const));
      if (requestId.current !== id) return;
      setStrokes(Object.fromEntries(loaded.map(([char, data]) => [char, data?.strokes ?? null])));
      setLoading(false);
    } catch {
      if (requestId.current !== id) return;
      setError("笔顺数据暂时下载不到。");
      setLoading(false);
    }
  }

  async function openSheet() {
    setSelected(shown.map(() => true));
    setPdfError("");
    setOpen(true);
    await loadStrokeData(shown);
  }

  function changeMode(next: SheetMode) {
    setMode(next);
    setPdfError("");
    if (!open) return;
    const source = next === "copy" ? copyChars : hanChars;
    const chars = source.slice(0, next === "copy" ? COPY_LIMIT : SHEET_LIMIT);
    void loadStrokeData(chars);
  }

  function closeSheet() {
    requestId.current += 1;
    setPdfError("");
    setOpen(false);
  }

  async function savePdf() {
    setSaving(true);
    setPdfError("");
    try {
      const pdf = await import("@/lib/stroke-pdf");
      if (mode === "copy") {
        await pdf.downloadCopyPdf({
          sentence: text,
          truncated,
          boxSize,
          items: copied.map((char) => ({ char, strokes: strokes[char] ?? null })),
        });
      } else {
        const items = shown.flatMap((char, index) => (
          picks[index] ? [{ char, strokes: strokes[char] ?? null }] : []
        ));
        await pdf.downloadStrokePdf({ sentence: text, truncated, items, boxSize, practiceBoxes: PRACTICE_BOXES });
      }
    } catch (reason) {
      setPdfError(reason instanceof Error ? reason.message : "PDF 暂时没有保存下来。");
    } finally {
      setSaving(false);
    }
  }

  const button = (
    <button
      type="button"
      className="rounded-full border border-line px-3 py-1 text-xs hover:bg-accent-soft disabled:opacity-40"
      disabled={shown.length === 0}
      onClick={() => void openSheet()}
    >
      {t.printSheet}
    </button>
  );

  if (!open || typeof document === "undefined") return button;

  const title = mode === "copy" ? t.sheetTitleCopy : "香港繁体笔顺工作纸";
  const previewHint = mode === "copy"
    ? t.sheetCopyHint
    : "预览工作纸。红色是该步新写的一笔。只输出勾选的字，方格大小会一起用于打印和 PDF。";

  return (
    <>
      {button}
      {createPortal(
        <div className="stroke-print" data-box={boxSize} role="dialog" aria-modal="true" aria-label={title}>
          <div className="no-print sticky top-0 z-10 border-b border-neutral-300 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-neutral-700">{previewHint}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-neutral-900 px-4 py-2 text-sm text-neutral-900 disabled:opacity-40"
                  disabled={selectedCount === 0 || loading || saving}
                  onClick={() => void savePdf()}
                >
                  {saving ? "正在生成…" : "另存为 PDF"}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
                  disabled={selectedCount === 0 || loading}
                  onClick={() => {
                    const now = new Date();
                    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                    document.documentElement.style.setProperty("--print-date", `"${date}"`);
                    window.print();
                  }}
                >
                  打印
                </button>
                <button
                  type="button"
                  className="rounded-full border border-neutral-400 px-4 py-2 text-sm"
                  onClick={closeSheet}
                >
                  关闭
                </button>
              </div>
            </div>
            {pdfError ? <p className="px-4 pb-3 text-sm text-[#9c3b2e]">{pdfError}</p> : null}
            <fieldset className="border-t border-neutral-200 px-4 py-3">
              <legend className="sr-only">工作纸种类</legend>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-neutral-700">种类</p>
                {([
                  ["strokes", t.sheetModeStrokes],
                  ["copy", t.sheetModeCopy],
                ] as const).map(([value, label]) => (
                  <label
                    key={value}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${mode === value ? "border-neutral-900 bg-neutral-100" : "border-neutral-300"}`}
                  >
                    <input
                      type="radio"
                      name="sheet-mode"
                      checked={mode === value}
                      onChange={() => changeMode(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="border-t border-neutral-200 px-4 py-3">
              <legend className="sr-only">方格大小</legend>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-neutral-700">方格大小</p>
                {([
                  ["small", "小方格"],
                  ["large", "大方格"],
                ] as const).map(([size, label]) => (
                  <label
                    key={size}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${boxSize === size ? "border-neutral-900 bg-neutral-100" : "border-neutral-300"}`}
                  >
                    <input
                      type="radio"
                      name="sheet-box-size"
                      checked={boxSize === size}
                      onChange={() => setBoxSize(size)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="border-t border-neutral-200 px-4 py-3">
              <legend className="sr-only">选择要打印的字</legend>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-sm text-neutral-700">选择要打印的字（{selectedCount}/{shown.length}）</p>
                <button
                  type="button"
                  className="rounded-full border border-neutral-400 px-3 py-1 text-sm"
                  onClick={() => setAll(true)}
                >
                  全选
                </button>
                <button
                  type="button"
                  className="rounded-full border border-neutral-400 px-3 py-1 text-sm"
                  onClick={() => setAll(false)}
                >
                  取消全选
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {shown.map((char, index) => (
                  <label
                    key={`${char}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2 py-1 text-lg"
                  >
                    <input type="checkbox" checked={picks[index]} onChange={() => toggleAt(index)} />
                    {char}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <article className="mx-auto flex w-full max-w-[186mm] flex-col gap-8 bg-white px-6 py-8 text-neutral-900">
            <header>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-xl leading-relaxed">{text}</p>
              {truncated ? <p className="mt-2 text-sm text-neutral-600">句子较长，这张纸只排前 {limit} 个字。</p> : null}
            </header>
            {loading ? <p>正在准备笔顺…</p> : null}
            {error ? <p>{error}</p> : null}
            {selectedCount === 0 ? <p className="no-print text-sm text-neutral-600">还没有选择要打印的字。</p> : null}
            {mode === "copy" ? (
              <div className="copy-grid">
                {copied.map((char, index) => (
                  <div key={`${char}-${index}`} className="copy-pair">
                    <ModelGlyph char={char} strokes={strokes[char]} />
                    <PracticeBox />
                  </div>
                ))}
              </div>
            ) : (
              shown.map((char, index) => {
                if (!picks[index]) return null;
                const paths = strokes[char];
                return (
                  <section key={`${char}-${index}`} className="flex flex-col gap-3 break-inside-avoid">
                    <h3 className="text-3xl font-medium">{char}</h3>
                    {paths && paths.length > 0 ? (
                      <ol className="flex flex-wrap gap-[var(--box-gap)]">
                        {paths.map((_, step) => (
                          <li key={step} className="flex flex-col items-center gap-1">
                            <StrokeGlyph strokes={paths} through={step + 1} />
                            <span className="text-xs text-neutral-600">{step + 1}</span>
                          </li>
                        ))}
                      </ol>
                    ) : loading ? null : (
                      <p className="text-sm text-neutral-600">这个字暂时没有笔顺数据，可以照着字本身临写。</p>
                    )}
                    <div className="flex flex-wrap gap-[var(--box-gap)]" aria-label={`${char} 的临写格`}>
                      {Array.from({ length: PRACTICE_BOXES }, (_, box) => (
                        <PracticeBox key={box} />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
            <footer className="sheet-print-footer border-t border-neutral-200 pt-4 text-xs text-neutral-500">
              {mode === "copy" ? (
                <p>上一行范字，下一行田字格，供抄写。田字格虚线会印在纸上。</p>
              ) : (
                <p>笔顺按 Make Me a Hanzi 的笔画数据绘出，供临写参考。</p>
              )}
              <p className="mt-2">{siteName} · {siteNameEn}</p>
              <p>
                <a href={siteUrl} className="underline">{siteUrl}</a>
              </p>
            </footer>
          </article>
        </div>,
        document.body,
      )}
    </>
  );
}
