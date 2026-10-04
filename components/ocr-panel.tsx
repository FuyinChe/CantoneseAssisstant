"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { recognizeImage } from "@/lib/ocr";

type Selection = { x: number; y: number; w: number; h: number };

function DownArrow() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
      <path
        d="M1.5 1.5 11 8.5 20.5 1.5M1.5 7.5 11 14.5 20.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function OcrPanel({ onText }: { onText: (text: string) => void }) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<Selection | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [preview, setPreview] = useState({ width: 1, height: 1 });
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function paint(next: Selection | null) {
    const view = viewRef.current;
    const image = imageRef.current;
    if (!view || !image) return;
    const context = view.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, view.width, view.height);
    context.drawImage(image, 0, 0, view.width, view.height);
    if (!next || next.w < 4 || next.h < 4) return;
    context.save();
    context.strokeStyle = "#9c3b2e";
    context.lineWidth = 2;
    context.strokeRect(next.x, next.y, next.w, next.h);
    context.fillStyle = "rgba(156, 59, 46, 0.18)";
    context.fillRect(next.x, next.y, next.w, next.h);
    context.restore();
  }

  useLayoutEffect(() => {
    paint(selection);
  });

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = viewRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
      y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
    };
  }

  function fullCanvas() {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, 0, 0);
    return canvas;
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
      setCollapsed(true);
      setStatus("识别完成，已填入上方文字。图片只留在这台浏览器里。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "识别失败。");
      setStatus("");
    }
  }

  function loadFile(file: File) {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      const scale = Math.min(1, 720 / image.naturalWidth);
      setPreview({
        width: Math.max(1, Math.round(image.naturalWidth * scale)),
        height: Math.max(1, Math.round(image.naturalHeight * scale)),
      });
      setSelection(null);
      setHasImage(true);
      setCollapsed(false);
      setError("");
      setStatus("按住图片拖动，框出要识别的字，再按识别选区。");
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("这张图片读不出来。请换成 JPG 或 PNG 再试。");
      setStatus("");
    };
    image.src = url;
  }

  async function recognizeSelection() {
    const image = imageRef.current;
    const view = viewRef.current;
    if (!image || !view) {
      setError("请先选择一张图片。");
      return;
    }
    if (!selection || selection.w < 8 || selection.h < 8) {
      setError("先在图片上拖出一个区域。");
      return;
    }
    const scaleX = image.naturalWidth / view.width;
    const scaleY = image.naturalHeight / view.height;
    const crop = document.createElement("canvas");
    crop.width = Math.max(1, Math.round(selection.w * scaleX));
    crop.height = Math.max(1, Math.round(selection.h * scaleY));
    const context = crop.getContext("2d");
    if (!context) return;
    context.drawImage(
      image,
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
        <label className="relative inline-flex cursor-pointer rounded-full border border-line px-4 py-2 text-sm">
          拍照或上传
          <input
            className="absolute inset-0 cursor-pointer opacity-0"
            type="file"
            accept="image/*"
            aria-label="拍照或上传图片"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) loadFile(file);
            }}
          />
        </label>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm"
          onClick={() => {
            const source = fullCanvas();
            if (!source) {
              setError("请先选择一张图片。");
              return;
            }
            void recognize(source);
          }}
        >
          识别整张
        </button>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm"
          onClick={() => void recognizeSelection()}
        >
          识别选区
        </button>
        {hasImage && !collapsed ? (
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm"
            onClick={() => setCollapsed(true)}
          >
            隐藏图片
          </button>
        ) : null}
      </div>
      {hasImage ? (
        <div className={`relative overflow-hidden rounded-lg border border-line ${collapsed ? "max-h-20" : ""}`}>
        <canvas
          ref={viewRef}
          width={preview.width}
          height={preview.height}
          className={`max-w-full touch-none ${collapsed ? "pointer-events-none" : ""}`}
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
            setSelection({
              x: Math.min(drag.x, current.x),
              y: Math.min(drag.y, current.y),
              w: Math.abs(current.x - drag.x),
              h: Math.abs(current.y - drag.y),
            });
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        />
        {collapsed ? (
          <button
            type="button"
            className="absolute inset-0 text-foreground"
            aria-label="展开图片"
            onClick={() => setCollapsed(false)}
          >
            <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-card/80">
              <DownArrow />
            </span>
          </button>
        ) : null}
        </div>
      ) : null}
      {status ? <p className="text-sm text-muted">{status}</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
