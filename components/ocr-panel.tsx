"use client";

import { useRef, useState } from "react";
import { recognizeImage } from "@/lib/ocr";

type Selection = { x: number; y: number; w: number; h: number };

export function OcrPanel({ onText }: { onText: (text: string) => void }) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<Selection | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function paint(next: Selection | null) {
    const view = viewRef.current;
    const source = sourceRef.current;
    if (!view || !source) return;
    const context = view.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, view.width, view.height);
    context.drawImage(source, 0, 0, view.width, view.height);
    if (!next || next.w < 4 || next.h < 4) return;
    context.save();
    context.strokeStyle = "#9c3b2e";
    context.lineWidth = 2;
    context.strokeRect(next.x, next.y, next.w, next.h);
    context.fillStyle = "rgba(156, 59, 46, 0.18)";
    context.fillRect(next.x, next.y, next.w, next.h);
    context.restore();
  }

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = viewRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
      y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
    };
  }

  async function recognize(target: HTMLCanvasElement) {
    setError("");
    setStatus("正在下载识别语言包…");
    try {
      const text = await recognizeImage(target, (update) => {
        const percent = Math.round(update.progress * 100);
        setStatus(`${update.status} ${percent}%`);
      });
      if (!text) {
        setError("没有识别到文字。可以框选文字更集中的区域再试。");
        setStatus("");
        return;
      }
      onText(text);
      setStatus("识别完成，已填入上方文字。图片只留在这台浏览器里。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "识别失败。");
      setStatus("");
    }
  }

  async function recognizeSelection() {
    const source = sourceRef.current;
    const view = viewRef.current;
    if (!source || !view || !selection || selection.w < 8 || selection.h < 8) {
      setError("先在图片上拖出一个区域。");
      return;
    }
    const scaleX = source.width / view.width;
    const scaleY = source.height / view.height;
    const crop = document.createElement("canvas");
    crop.width = Math.max(1, Math.round(selection.w * scaleX));
    crop.height = Math.max(1, Math.round(selection.h * scaleY));
    const context = crop.getContext("2d");
    if (!context) return;
    context.drawImage(
      source,
      selection.x * scaleX,
      selection.y * scaleY,
      selection.w * scaleX,
      selection.h * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );
    await recognize(crop);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm"
          onClick={() => fileRef.current?.click()}
        >
          拍照或上传
        </button>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-40"
          disabled={!hasImage}
          onClick={() => {
            const source = sourceRef.current;
            if (source) void recognize(source);
          }}
        >
          识别整张
        </button>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-40"
          disabled={!hasImage}
          onClick={() => void recognizeSelection()}
        >
          识别选区
        </button>
      </div>
      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="拍照或上传图片"
        onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
              const source = sourceRef.current;
              const view = viewRef.current;
              if (!source || !view) return;
              source.width = image.width;
              source.height = image.height;
              source.getContext("2d")?.drawImage(image, 0, 0);
              const maxWidth = 720;
              const scale = Math.min(1, maxWidth / image.width);
              view.width = Math.max(1, Math.round(image.width * scale));
              view.height = Math.max(1, Math.round(image.height * scale));
              setSelection(null);
              setHasImage(true);
              setError("");
              setStatus("");
              paint(null);
              URL.revokeObjectURL(url);
            };
            image.src = url;
          }}
        />
      <div className={hasImage ? "block" : "hidden"}>
        <canvas
          ref={viewRef}
          className="max-w-full touch-none rounded-lg border border-line"
          aria-label="待识别图片，可拖选文字区域"
          onPointerDown={(event) => {
            const start = pointFromEvent(event);
            dragRef.current = { ...start, w: 0, h: 0 };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            const current = pointFromEvent(event);
            const next = {
              x: Math.min(drag.x, current.x),
              y: Math.min(drag.y, current.y),
              w: Math.abs(current.x - drag.x),
              h: Math.abs(current.y - drag.y),
            };
            setSelection(next);
            paint(next);
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
        />
      </div>
      <canvas ref={sourceRef} className="hidden" />
      {status ? <p className="text-sm text-muted">{status}</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
