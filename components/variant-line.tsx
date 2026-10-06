"use client";

import { useEffect, useState } from "react";
import { annotate, type JyutpingToken } from "@/lib/jyutping";
import { learningSpeech } from "@/lib/speech/player";
import type { SpeechLang } from "@/lib/speech/types";
import { replaceChar, variantSlots } from "@/lib/variants";

const hanPattern = /\p{Script=Han}/u;

function readingsFor(chars: string[], tokens: JyutpingToken[]) {
  const readings: string[][] = chars.map(() => []);
  let tokenIndex = 0;
  for (let index = 0; index < chars.length; index += 1) {
    const token = tokens[tokenIndex];
    if (!token) break;
    if (token.text === chars[index]) {
      readings[index] = token.readings;
      tokenIndex += 1;
      continue;
    }
    const tokenChars = Array.from(token.text);
    if (tokenChars.length > 1 && chars.slice(index, index + tokenChars.length).join("") === token.text) {
      readings[index] = token.readings;
      index += tokenChars.length - 1;
      tokenIndex += 1;
    }
  }
  return readings;
}

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
  const [tokens, setTokens] = useState<JyutpingToken[]>([]);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [openReading, setOpenReading] = useState<number | null>(null);
  const [openVariant, setOpenVariant] = useState<number | null>(null);
  const [error, setError] = useState("");
  const chars = Array.from(text);
  const slots = variantSlots(simplified, text);
  const anyVariant = slots.some((options) => options.length > 1);
  const readingRows = readingsFor(chars, tokens);

  useEffect(() => {
    let cancelled = false;
    setOverrides({});
    setOpenReading(null);
    setOpenVariant(null);
    void annotate(text).then((next) => {
      if (!cancelled) setTokens(next);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!text) return <p className="min-h-16 text-lg">…</p>;

  function speak(token: string) {
    setError("");
    void learningSpeech.speak(token, lang).catch((reason: Error) => setError(reason.message));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="flex min-h-16 flex-wrap items-start gap-x-3 gap-y-2">
        {chars.map((char, index) => {
          if (char === "\n" || char === "\r") {
            return <span key={`nl-${index}`} className="h-2 w-full basis-full" aria-hidden="true" />;
          }
          const options = slots[index] ?? [];
          const choices = options.length > 1;
          const readings = readingRows[index] ?? [];
          const reading = overrides[index] ?? readings[0] ?? "";
          const readingChoices = readings.length > 1;
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
                  aria-label={`${char}，粤拼 ${reading || "无"}，${speakLabel}${choices ? `，${chooseLabel}` : ""}${marked ? "，这字和其他字形不同" : ""}`}
                  onClick={() => {
                    setOpenReading(null);
                    setOpenVariant(null);
                    speak(char);
                  }}
                >
                  {char}
                </button>
              ) : (
                <span className={characterClass}>{char}</span>
              )}
              {anyVariant ? (
                choices ? (
                  <button
                    type="button"
                    className="rounded text-lg leading-none text-muted hover:bg-accent-soft"
                    aria-expanded={openVariant === index}
                    aria-label={`${char}，${chooseLabel} ${options.join(" ")}`}
                    onClick={() => {
                      setOpenReading(null);
                      setOpenVariant(openVariant === index ? null : index);
                    }}
                  >
                    {options.find((choice) => choice !== char) ?? char}
                  </button>
                ) : (
                  <span className="invisible text-lg leading-none" aria-hidden="true">
                    .
                  </span>
                )
              ) : null}
              {reading ? (
                readingChoices ? (
                  <button
                    type="button"
                    className="rounded text-lg leading-none whitespace-nowrap text-muted hover:bg-accent-soft"
                    aria-expanded={openReading === index}
                    aria-label={`${char} 的粤拼 ${reading}，可改读音`}
                    onClick={() => {
                      setOpenVariant(null);
                      setOpenReading(openReading === index ? null : index);
                    }}
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
              {openReading === index ? (
                <span className="absolute top-full left-1/2 z-10 mt-1 flex -translate-x-1/2 flex-col rounded-md border border-line bg-card p-1 shadow-sm">
                  {readings.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="rounded px-2 py-1 text-left text-lg whitespace-nowrap hover:bg-accent-soft"
                      onClick={() => {
                        setOverrides((current) => ({ ...current, [index]: choice }));
                        setOpenReading(null);
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </span>
              ) : null}
              {openVariant === index ? (
                <span className="absolute top-full left-1/2 z-10 mt-1 flex -translate-x-1/2 flex-col rounded-md border border-line bg-card p-1 shadow-sm">
                  {options.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="rounded px-2 py-1 text-left text-lg hover:bg-accent-soft"
                      onClick={() => {
                        onChange(replaceChar(text, index, choice));
                        setOpenVariant(null);
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
