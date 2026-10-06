"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { recognizeImage } from "@/lib/ocr";
import { useLocale } from "@/lib/locale";

type Selection = { x: number; y: number; w: number; h: number };
type Handle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
type Drag =
  | { kind: "draw"; x: number; y: number }
  | { kind: "move"; x: number; y: number; orig: Selection }
  | { kind: "resize"; handle: Handle; orig: Selection };

const handles: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

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

function clampBox(next: Selection, width: number, height: number): Selection {
  const w = Math.min(Math.max(8, next.w), width);
  const h = Math.min(Math.max(8, next.h), height);
  return {
    w,
    h,
    x: Math.min(Math.max(0, next.x), Math.max(0, width - w)),
    y: Math.min(Math.max(0, next.y), Math.max(0, height - h)),
  };
}

function normalizeBox(x: number, y: number, w: number, h: number, width: number, height: number) {
  const left = w < 0 ? x + w : x;
  const top = h < 0 ? y + h : y;
  return clampBox({ x: left, y: top, w: Math.abs(w), h: Math.abs(h) }, width, height);
}

function inside(box: Selection, point: { x: number; y: number }, pad = 0) {
  return (
    point.x >= box.x - pad &&
    point.x <= box.x + box.w + pad &&
    point.y >= box.y - pad &&
    point.y <= box.y + box.h + pad
  );
}

function handlePoint(box: Selection, handle: Handle) {
  const mx = box.x + box.w / 2;
  const my = box.y + box.h / 2;
  if (handle === "nw") return { x: box.x, y: box.y };
  if (handle === "n") return { x: mx, y: box.y };
  if (handle === "ne") return { x: box.x + box.w, y: box.y };
  if (handle === "e") return { x: box.x + box.w, y: my };
  if (handle === "se") return { x: box.x + box.w, y: box.y + box.h };
  if (handle === "s") return { x: mx, y: box.y + box.h };
  if (handle === "sw") return { x: box.x, y: box.y + box.h };
  return { x: box.x, y: my };
}

function hitHandle(box: Selection, point: { x: number; y: number }, slop: number): Handle | null {
  for (const handle of handles) {
    const spot = handlePoint(box, handle);
    if (Math.abs(spot.x - point.x) <= slop && Math.abs(spot.y - point.y) <= slop) return handle;
  }
  return null;
}

function resizeBox(orig: Selection, handle: Handle, point: { x: number; y: number }, width: number, height: number) {
  let { x, y, w, h } = orig;
  if (handle.includes("w")) {
    w = orig.x + orig.w - point.x;
    x = point.x;
  }
  if (handle.includes("e")) w = point.x - orig.x;
  if (handle.includes("n")) {
    h = orig.y + orig.h - point.y;
    y = point.y;
  }
  if (handle.includes("s")) h = point.y - orig.y;
  return normalizeBox(x, y, w, h, width, height);
}

function cursorFor(handle: Handle | null, moving: boolean) {
  if (handle === "n" || handle === "s") return "ns-resize";
  if (handle === "e" || handle === "w") return "ew-resize";
  if (handle === "nw" || handle === "se") return "nwse-resize";
  if (handle === "ne" || handle === "sw") return "nesw-resize";
  if (moving) return "move";
  return "crosshair";
}

export function OcrPanel({ onText }: { onText: (text: string) => void }) {
  const { t } = useLocale();
  const viewRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [preview, setPreview] = useState({ width: 1, height: 1 });
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  function canvasSlop() {
    const view = viewRef.current;
    if (!view) return 14;
    const bounds = view.getBoundingClientRect();
    const scale = bounds.width > 0 ? view.width / bounds.width : 1;
    return Math.max(12, 12 * scale);
  }

  function handleSize() {
    return Math.max(8, canvasSlop() * 0.7);
  }

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
    context.lineWidth = Math.max(2, handleSize() / 4);
    context.strokeRect(next.x, next.y, next.w, next.h);
    context.fillStyle = "rgba(156, 59, 46, 0.18)";
    context.fillRect(next.x, next.y, next.w, next.h);
    const size = handleSize();
    context.fillStyle = "#9c3b2e";
    for (const handle of handles) {
      const spot = handlePoint(next, handle);
      context.fillRect(spot.x - size / 2, spot.y - size / 2, size, size);
    }
    context.restore();
  }

  useLayoutEffect(() => {
    paint(selection);
  });

  function pointFromEvent(event: { clientX: number; clientY: number }) {
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

  function ocrPhase(raw: string) {
    const status = raw.toLowerCase();
    if (status.includes("model") || status.includes("language") || status.includes("download")) return t.ocrLoadingLang;
    if (status.includes("loading tesseract") || status.includes("loaded tesseract") || status.includes("core")) {
      return t.ocrPreparing;
    }
    if (status.includes("initializ")) return t.ocrInit;
    if (status.includes("recogniz")) return t.ocrReading;
    return t.ocrBusy;
  }

  async function recognize(target: HTMLCanvasElement) {
    setError("");
    setBusy(true);
    setProgress(0);
    setCollapsed(false);
    setStatus(t.ocrPreparing);
    try {
      const text = await recognizeImage(target, (update) => {
        setProgress(Math.max(0, Math.min(100, Math.round(update.progress * 100))));
        setStatus(ocrPhase(update.status));
      });
      if (!text) {
        setError(t.ocrEmpty);
        setStatus("");
        return;
      }
      onText(text);
      setCollapsed(true);
      setStatus(t.ocrDone);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.ocrFail);
      setStatus("");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  function loadFile(file: File) {
    stopCamera();
    setError("");
    setStatus(t.ocrOpening);
    setBusy(true);
    setProgress(0);
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
      setBusy(false);
      setStatus(t.ocrHint);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setBusy(false);
      setError(t.badImage);
      setStatus("");
    };
    image.src = url;
  }

  function stopCamera() {
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setCameraOpen(false);
  }

  async function openCameraStream() {
    const trials: MediaStreamConstraints[] = [
      { audio: false, video: { facingMode: { exact: "environment" } } },
      { audio: false, video: { facingMode: { ideal: "environment" } } },
      { audio: false, video: true },
    ];
    let lastError: unknown;
    for (const constraints of trials) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (reason) {
        lastError = reason;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("camera");
  }

  async function startCamera() {
    if (busy) return;
    setError("");
    setStatus("");
    const nativeCapture = () => cameraInputRef.current?.click();
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (mobile) {
      nativeCapture();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t.cameraNeed);
      return;
    }
    try {
      const stream = await openCameraStream();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setError(t.cameraNeed);
    }
  }

  function shootPhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth < 2 || video.videoHeight < 2) {
      setError(t.cameraNeed);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      stopCamera();
      if (!blob) {
        setError(t.cameraNeed);
        return;
      }
      loadFile(new File([blob], "camera.jpg", { type: blob.type || "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {
      setError(t.cameraNeed);
      stopCamera();
    });
  }, [cameraOpen, t.cameraNeed]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function recognizeFull() {
    const source = fullCanvas();
    if (!source) {
      setError(t.needImage);
      return;
    }
    void recognize(source);
  }

  async function recognizeSelection() {
    const image = imageRef.current;
    const view = viewRef.current;
    if (!image || !view) {
      setError(t.needImage);
      return;
    }
    if (!selection || selection.w < 8 || selection.h < 8) {
      setError(t.needCrop);
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

  function updateCursor(point: { x: number; y: number }) {
    const view = viewRef.current;
    if (!view) return;
    if (!selection) {
      view.style.cursor = "crosshair";
      return;
    }
    const handle = hitHandle(selection, point, canvasSlop());
    view.style.cursor = cursorFor(handle, inside(selection, point));
  }

  const waiting = busy;
  const showProgress = waiting || Boolean(status);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-foreground px-4 py-2 text-[0.88rem] text-background disabled:opacity-40"
          aria-label={t.cameraAria}
          disabled={waiting}
          onClick={() => void startCamera()}
        >
          {t.camera}
        </button>
        <label className={`relative inline-flex items-center rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] ${waiting ? "pointer-events-none opacity-40" : "cursor-pointer"}`}>
          {t.upload}
          <input
            className="absolute inset-0 cursor-pointer opacity-0"
            type="file"
            accept="image/*"
            aria-label={t.uploadAria}
            disabled={waiting}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) loadFile(file);
            }}
          />
        </label>
        <input
          ref={cameraInputRef}
          className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          type="file"
          accept="image/*"
          capture="environment"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) loadFile(file);
          }}
        />
        <button
          type="button"
          className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] disabled:opacity-40"
          disabled={waiting}
          onClick={recognizeFull}
        >
          {t.recognizeAll}
        </button>
        <button
          type="button"
          className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] disabled:opacity-40"
          disabled={waiting}
          onClick={() => void recognizeSelection()}
        >
          {t.recognizeCrop}
        </button>
        {hasImage && !collapsed ? (
          <button
            type="button"
            className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] disabled:opacity-40"
            disabled={waiting}
            onClick={() => setCollapsed(true)}
          >
            {t.hideImage}
          </button>
        ) : null}
      </div>
      {cameraOpen ? (
        <div className="flex flex-col gap-3">
          <video
            ref={videoRef}
            className="max-h-[70vh] w-full rounded-lg border border-line bg-foreground object-cover"
            autoPlay
            muted
            playsInline
            aria-label={t.cameraAria}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-foreground px-4 py-2 text-[0.88rem] text-background"
              onClick={shootPhoto}
            >
              {t.cameraShoot}
            </button>
            <button
              type="button"
              className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem]"
              onClick={stopCamera}
            >
              {t.cameraClose}
            </button>
          </div>
        </div>
      ) : null}
      {hasImage ? (
        <div className={`relative overflow-hidden rounded-lg border border-line ${collapsed && !waiting ? "max-h-20" : ""}`}>
          <canvas
            ref={viewRef}
            width={preview.width}
            height={preview.height}
            className={`max-w-full touch-none ${collapsed && !waiting ? "pointer-events-none" : ""}`}
            aria-label={t.ocrHint}
            onPointerDown={(event) => {
              if (waiting) return;
              const view = event.currentTarget;
              const start = pointFromEvent(event);
              const slop = canvasSlop();
              if (selection) {
                const handle = hitHandle(selection, start, slop);
                if (handle) {
                  dragRef.current = { kind: "resize", handle, orig: selection };
                } else if (inside(selection, start)) {
                  dragRef.current = { kind: "move", x: start.x, y: start.y, orig: selection };
                } else {
                  dragRef.current = { kind: "draw", x: start.x, y: start.y };
                }
              } else {
                dragRef.current = { kind: "draw", x: start.x, y: start.y };
              }
              view.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const point = pointFromEvent(event);
              const drag = dragRef.current;
              const view = viewRef.current;
              if (!drag) {
                updateCursor(point);
                return;
              }
              if (!view) return;
              if (drag.kind === "draw") {
                view.style.cursor = "crosshair";
                setSelection(normalizeBox(drag.x, drag.y, point.x - drag.x, point.y - drag.y, view.width, view.height));
                return;
              }
              if (drag.kind === "move") {
                view.style.cursor = "move";
                setSelection(
                  clampBox(
                    {
                      ...drag.orig,
                      x: drag.orig.x + (point.x - drag.x),
                      y: drag.orig.y + (point.y - drag.y),
                    },
                    view.width,
                    view.height,
                  ),
                );
                return;
              }
              view.style.cursor = cursorFor(drag.handle, false);
              setSelection(resizeBox(drag.orig, drag.handle, point, view.width, view.height));
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
            onDoubleClick={(event) => {
              if (waiting) return;
              dragRef.current = null;
              const point = pointFromEvent(event);
              const crop = selection && selection.w >= 8 && selection.h >= 8 && inside(selection, point, canvasSlop());
              if (crop) {
                void recognizeSelection();
                return;
              }
              recognizeFull();
            }}
          />
          {waiting ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 px-4" role="status" aria-live="polite">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden="true" />
              <p className="text-center text-sm text-foreground">{status || t.ocrBusy}</p>
              <div className="h-1.5 w-[min(16rem,70%)] overflow-hidden rounded-full bg-line">
                {progress > 0 ? (
                  <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
                ) : (
                  <div className="h-full w-1/3 bg-accent" style={{ animation: "ocr-slide 1.1s ease-in-out infinite" }} />
                )}
              </div>
            </div>
          ) : null}
          {collapsed && !waiting ? (
            <button
              type="button"
              className="absolute inset-0 text-foreground"
              aria-label={t.expandImage}
              onClick={() => setCollapsed(false)}
              onDoubleClick={(event) => {
                event.preventDefault();
                if (waiting) return;
                recognizeFull();
              }}
            >
              <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-card/80">
                <DownArrow />
              </span>
            </button>
          ) : null}
        </div>
      ) : waiting ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-line bg-card px-4 py-8" role="status" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden="true" />
          <p className="text-sm text-foreground">{status || t.ocrOpening}</p>
        </div>
      ) : null}
      {showProgress && !waiting ? <p className="text-sm text-muted">{status}</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
