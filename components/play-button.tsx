"use client";

import { useEffect, useState } from "react";
import { BrowserSpeech, findVoice } from "@/lib/speech/browser";
import type { SpeechLang } from "@/lib/speech/types";

const engine = new BrowserSpeech();

const warnings: Record<SpeechLang, string> = {
  "zh-CN": "这部设备没有列出普通话语音，浏览器可能会改用其他中文语音。",
  "zh-HK": "这部设备没有列出粤语语音。macOS 和 iOS 通常有 Sinji；桌面版 Chrome 经常没有粤语语音。",
  "zh-TW": "这部设备没有列出台湾国语语音。macOS 通常有美佳（Meijia）。",
  "en-US": "这部设备没有列出英语语音。",
};

export function PlayButton({
  text,
  lang,
  label,
}: {
  text: string;
  lang: SpeechLang;
  label: string;
}) {
  const [ready, setReady] = useState(false);
  const [voiceLabel, setVoiceLabel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const update = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      if (voices.length === 0) return;
      const voice = findVoice(lang);
      setVoiceLabel(voice ? `${voice.name} · ${voice.lang}` : "");
      setReady(true);
    };
    update();
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    const timer = window.setTimeout(() => setReady(true), 800);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", update);
      window.clearTimeout(timer);
    };
  }, [lang]);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className="rounded-full bg-accent px-4 py-2 text-sm text-white disabled:opacity-40"
        disabled={!text.trim()}
        onClick={() => {
          setError("");
          void engine.speak(text, lang).catch((reason: Error) => setError(reason.message));
        }}
      >
        {label}
      </button>
      {ready && voiceLabel ? <p className="text-sm text-muted">{voiceLabel}</p> : null}
      {ready && !voiceLabel ? <p className="max-w-xs text-sm text-muted">{warnings[lang]}</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
