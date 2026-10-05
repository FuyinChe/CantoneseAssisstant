"use client";

import { useState } from "react";
import { learningSpeech } from "@/lib/speech/player";
import type { SpeechLang } from "@/lib/speech/types";
import { replaceChar, variantSlots } from "@/lib/variants";

const hanPattern = /\p{Script=Han}/u;

export function VariantLine({
  text,
  simplified,
  marks,
  lang,
  speakLabel,
  chooseLabel,
  onChange,
}: {
  text: string;
  simplified: string;
  marks?: boolean[];
  lang: SpeechLang;
  speakLabel: string;
  chooseLabel: string;
  onChange: (text: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const chars = Array.from(text);
  const slots = variantSlots(simplified, text);

  if (!text) return <p className="min-h-16 text-lg">…</p>;

  function speak(token: string) {
    setError("");
    void learningSpeech.speak(token, lang).catch((reason: Error) => setError(reason.message));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="flex min-h-16 flex-wrap items-start gap-x-3 gap-y-2">
        {chars.map((char, index) => {
          const options = slots[index] ?? [];
          const choices = options.length > 1;
          const speakable = hanPattern.test(char);
          const marked = marks?.[index] ?? false;
          const characterClass = marked
            ? "rounded-sm bg-accent-soft px-0.5 text-lg leading-none text-accent"
            : "rounded px-0.5 text-lg leading-none";
          return (
            <span key={`${char}-${index}`} className="relative inline-flex flex-col items-center">
              {speakable ? (
                <button
                  type="button"
                  className={`${characterClass} hover:bg-accent-soft${choices ? " underline decoration-dotted decoration-muted underline-offset-4" : ""}`}
                  aria-label={`${char}，${speakLabel}${choices ? `，${chooseLabel}` : ""}${marked ? "，这字和其他字形不同" : ""}`}
                  onClick={() => {
                    setOpenIndex(null);
                    speak(char);
                  }}
                >
                  {char}
                </button>
              ) : (
                <span className={characterClass}>{char}</span>
              )}
              {choices ? (
                <button
                  type="button"
                  className="rounded text-lg leading-none text-muted hover:bg-accent-soft"
                  aria-expanded={openIndex === index}
                  aria-label={`${char}，${chooseLabel} ${options.join(" ")}`}
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  {options.find((choice) => choice !== char) ?? char}
                </button>
              ) : (
                <span className="invisible text-lg leading-none" aria-hidden="true">
                  .
                </span>
              )}
              {openIndex === index ? (
                <span className="absolute top-full left-1/2 z-10 mt-1 flex -translate-x-1/2 flex-col rounded-md border border-line bg-card p-1 shadow-sm">
                  {options.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="rounded px-2 py-1 text-left text-lg hover:bg-accent-soft"
                      onClick={() => {
                        onChange(replaceChar(text, index, choice));
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
      </p>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
