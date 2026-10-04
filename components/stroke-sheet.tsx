"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SheetBoxSize } from "@/lib/stroke-pdf";
import { siteName, siteNameEn, siteUrl } from "@/lib/site";
import { loadStrokes } from "@/lib/strokes";

const hanPattern = /\p{Script=Han}/u;
const PRACTICE_BOXES = 5;
const SHEET_LIMIT = 40;

const BOX = 72;

function TianziLines() {
  return (
    <>
      <line x1={BOX / 2} y1="1" x2={BOX / 2} y2={BOX - 1} className="tianzi-line" stroke="#78716c" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="1" y1={BOX / 2} x2={BOX - 1} y2={BOX / 2} className="tianzi-line" stroke="#78716c" strokeWidth="1" strokeDasharray="4 3" />
    </>
  );
}

function StrokeGlyph({
  strokes,
  through,
}: {
  strokes: string[];
  through: number;
}) {
  const scale = BOX / 1024;
  return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} className="stroke-box" aria-hidden="true">
      <TianziLines />
      <g transform={`translate(0, ${BOX}) scale(${scale}, ${-scale})`}>
        {strokes.slice(0, through).map((path, index) => (
          <path key={index} d={path} fill={index === through - 1 ? "#9c3b2e" : "#1f1a14"} />
        ))}
      </g>
    </svg>
  );
}

export function StrokeSheet({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [strokes, setStrokes] = useState<Record<string, string[] | null>>({});
  const [selected, setSelected] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [boxSize, setBoxSize] = useState<SheetBoxSize>("large");
  const requestId = useRef(0);
  const characters = Array.from(text).filter((char) => hanPattern.test(char));
  const shown = characters.slice(0, SHEET_LIMIT);
  const truncated = characters.length > SHEET_LIMIT;
  const picks = selected.length === shown.length ? selected : shown.map(() => true);
  const selectedCount = picks.filter(Boolean).length;

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

  async function openSheet() {
    const id = requestId.current + 1;
    requestId.current = id;
    setSelected(shown.map(() => true));
    setOpen(true);
    setLoading(true);
    setError("");
    const unique = [...new Set(shown)];
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

  function closeSheet() {
    requestId.current += 1;
    setPdfError("");
    setOpen(false);
  }

  async function savePdf() {
    setSaving(true);
    setPdfError("");
    try {
      const { downloadStrokePdf } = await import("@/lib/stroke-pdf");
      const items = shown.flatMap((char, index) => (
        picks[index] ? [{ char, strokes: strokes[char] ?? null }] : []
      ));
      await downloadStrokePdf({ sentence: text, truncated, items, boxSize, practiceBoxes: PRACTICE_BOXES });
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
      打印工作纸
    </button>
  );

  if (!open || typeof document === "undefined") return button;

  return (
    <>
      {button}
      {createPortal(
        <div className="stroke-print" data-box={boxSize} role="dialog" aria-modal="true" aria-label="香港繁体笔顺工作纸">
          <div className="no-print sticky top-0 z-10 border-b border-neutral-300 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-neutral-700">预览工作纸。红色是该步新写的一笔。只输出勾选的字，方格大小会一起用于打印和 PDF。</p>
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
                  disabled={selectedCount === 0}
                  onClick={() => window.print()}
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
              <legend className="sr-only">方格大小</legend>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-neutral-700">方格大小</p>
                {([
                  ["large", "大方格"],
                  ["small", "小方格"],
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
              <h2 className="text-2xl font-semibold">香港繁体笔顺工作纸</h2>
              <p className="mt-2 text-xl leading-relaxed">{text}</p>
              {truncated ? <p className="mt-2 text-sm text-neutral-600">句子较长，这张纸只排前 {SHEET_LIMIT} 个字。</p> : null}
            </header>
            {loading ? <p>正在准备笔顺…</p> : null}
            {error ? <p>{error}</p> : null}
            {selectedCount === 0 ? <p className="no-print text-sm text-neutral-600">还没有选择要打印的字。</p> : null}
            {shown.map((char, index) => {
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
                      <svg key={box} className="practice-box" viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
                        <rect x="0.5" y="0.5" width={BOX - 1} height={BOX - 1} className="practice-frame" fill="#fff" stroke="#44403c" />
                        <TianziLines />
                      </svg>
                    ))}
                  </div>
                </section>
              );
            })}
            <footer className="border-t border-neutral-200 pt-4 text-xs text-neutral-500">
              <p>笔顺按 Make Me a Hanzi 的笔画数据绘出，供临写参考。</p>
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
