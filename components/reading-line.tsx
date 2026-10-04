"use client";

import { useEffect, useState } from "react";
import type { JyutpingToken } from "@/lib/jyutping";
import { learningSpeech } from "@/lib/speech/player";
import type { SpeechLang } from "@/lib/speech/types";
const hanPattern = /\p{Script=Han}/u;

export function ReadingLine({
  text,
  lang,
  label,
  load,
  marks,
}: {
  text: string;
  lang: SpeechLang;
  label: string;
  load: (text: string) => Promise<JyutpingToken[]>;
  marks?: boolean[];
}) {
  const [tokens, setTokens] = useState<JyutpingToken[]>([]);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void load(text).then((next) => {
      if (!cancelled) setTokens(next);
    });
    return () => {
      cancelled = true;
    };
  }, [text, load]);

  if (!text) return null;

  function speak(token: string) {
    setError("");
    void learningSpeech.speak(token, lang).catch((reason: Error) => setError(reason.message));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        {tokens.map((token, index) => {
          const reading = overrides[index] ?? token.readings[0] ?? "";
          const choices = token.readings.length > 1;
          const speakable = hanPattern.test(token.text);
          const marked = marks?.[index] ?? false;
          const characterClass = marked
            ? "rounded-sm bg-accent-soft px-0.5 text-lg leading-none text-accent"
            : "rounded px-0.5 text-lg leading-none";
          return (
            <span key={`${token.text}-${index}`} className="relative inline-flex flex-col items-center">
              {speakable ? (
                <button
                  type="button"
                  className={`${characterClass} hover:bg-accent-soft`}
                  aria-label={`${token.text}，${label} ${reading || "无"}，点击朗读${marked ? "，这字和其他字形不同" : ""}`}
                  onClick={() => {
                    setOpenIndex(null);
                    speak(token.text);
                  }}
                >
                  {token.text}
                </button>
              ) : (
                <span className={characterClass}>{token.text}</span>
              )}
              {reading ? (
                choices ? (
                  <button
                    type="button"
                    className="rounded text-lg leading-none whitespace-nowrap text-muted hover:bg-accent-soft"
                    aria-expanded={openIndex === index}
                    aria-label={`${token.text} 的${label} ${reading}，可改读音`}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    {reading}
                  </button>
                ) : (
                  <span className="text-lg leading-none whitespace-nowrap text-muted">{reading}</span>
                )
              ) : (
                <span className="invisible text-lg leading-none whitespace-nowrap" aria-hidden="true">
                  .
                </span>
              )}
              {openIndex === index ? (
                <span className="absolute top-full left-1/2 z-10 mt-1 flex -translate-x-1/2 flex-col rounded-md border border-line bg-card p-1 shadow-sm">
                  {token.readings.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="rounded px-2 py-1 text-left text-lg whitespace-nowrap hover:bg-accent-soft"
                      onClick={() => {
                        setOverrides((current) => ({ ...current, [index]: choice }));
                        setOpenIndex(null);
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
