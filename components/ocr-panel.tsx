"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { recognizeImage } from "@/lib/ocr";
import { useLocale } from "@/lib/locale";

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
  const { t } = useLocale();
  const viewRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<Selection | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
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
    stopCamera();
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

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-foreground px-4 py-2 text-[0.88rem] text-background"
          aria-label={t.cameraAria}
          onClick={() => void startCamera()}
        >
          {t.camera}
        </button>
        <label className="relative inline-flex cursor-pointer items-center rounded-full border border-line bg-card px-4 py-2 text-[0.88rem]">
          {t.upload}
          <input
            className="absolute inset-0 cursor-pointer opacity-0"
            type="file"
            accept="image/*"
            aria-label={t.uploadAria}
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
          className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem]"
          onClick={() => {
            const source = fullCanvas();
            if (!source) {
              setError(t.needImage);
              return;
            }
            void recognize(source);
          }}
        >
          {t.recognizeAll}
        </button>
        <button
          type="button"
          className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem]"
          onClick={() => void recognizeSelection()}
        >
          {t.recognizeCrop}
        </button>
        {hasImage && !collapsed ? (
          <button
            type="button"
            className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem]"
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
            aria-label={t.expandImage}
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
