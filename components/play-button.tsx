"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { neuralVoices } from "@/lib/speech/catalog";
import { learningSpeech } from "@/lib/speech/player";
import { SPEECH_RATES, speechSentences } from "@/lib/speech/sentences";
import type { SpeechLang } from "@/lib/speech/types";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.14-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
    </svg>
  );
}

export function PlayButton({
  text,
  lang,
  label,
  caption,
}: {
  text: string;
  lang: SpeechLang;
  label: string;
  caption?: string;
}) {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [bySentence, setBySentence] = useState(false);
  const [rate, setRate] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const playId = useRef(0);
  const voiceLabel = caption ?? neuralVoices[lang].label;
  const sentences = speechSentences(text);
  const ready = Boolean(text.trim());

  function play(key: string, spoken: string) {
    const id = ++playId.current;
    setError("");
    setBusy(key);
    void learningSpeech.speak(spoken, lang, rate).catch((reason: Error) => {
      if (playId.current === id) setError(reason.message);
    }).finally(() => {
      if (playId.current === id) setBusy(null);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40"
          aria-label={label}
          title={label}
          aria-busy={busy === "all"}
          disabled={!ready}
          onClick={() => play("all", text)}
        >
          <PlayIcon />
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-sm disabled:opacity-40 ${bySentence ? "bg-foreground text-background" : "border border-line bg-card"}`}
          aria-pressed={bySentence}
          disabled={!ready}
          onClick={() => setBySentence((current) => !current)}
        >
          {t.speechSentences}
        </button>
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          {t.speechRate}
          <select
            className="rounded-full border border-line bg-card px-3 py-1 text-sm text-foreground disabled:opacity-40"
            value={rate}
            aria-label={t.speechRate}
            disabled={!ready}
            onChange={(event) => {
              const next = Number(event.target.value);
              setRate(next);
              learningSpeech.setPlaybackRate(next);
            }}
          >
            {SPEECH_RATES.map((value) => (
              <option key={value} value={value}>{Number.isInteger(value) ? `${value}.0` : String(value)}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-muted">{voiceLabel}</p>
      {bySentence ? (
        <ol className="flex w-full flex-col gap-2">
          {sentences.map((sentence, index) => (
            <li key={`${index}-${sentence}`} className="flex flex-wrap items-center gap-2">
              <span className="text-lg">{sentence}</span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card disabled:opacity-40"
                aria-label={`${t.playSentence}：${sentence}`}
                aria-busy={busy === `sentence-${index}`}
                onClick={() => play(`sentence-${index}`, sentence)}
              >
                <PlayIcon />
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {error ? <p className="max-w-xs text-sm text-accent">{error}</p> : null}
    </div>
  );
}
