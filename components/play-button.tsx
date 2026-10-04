"use client";

import { useState } from "react";
import { neuralVoices } from "@/lib/speech/catalog";
import { learningSpeech } from "@/lib/speech/player";
import type { SpeechLang } from "@/lib/speech/types";

export function PlayButton({
  text,
  lang,
  label,
}: {
  text: string;
  lang: SpeechLang;
  label: string;
}) {
  const [error, setError] = useState("");
  const voiceLabel = neuralVoices[lang].label;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white disabled:opacity-40"
        aria-label={label}
        title={label}
        disabled={!text.trim()}
        onClick={() => {
          setError("");
          void learningSpeech.speak(text, lang).catch((reason: Error) => setError(reason.message));
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.14-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
        </svg>
      </button>
      <p className="text-sm text-muted">{voiceLabel}</p>
      {error ? <p className="max-w-xs text-sm text-accent">{error}</p> : null}
    </div>
  );
}
