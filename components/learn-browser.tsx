"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { JyutpingLine } from "@/components/jyutping-line";
import { PlayButton } from "@/components/play-button";
import {
  bundledExamples,
  parseLocalExamples,
  readLocalExamplesSnapshot,
  subscribeLocalExamples,
  writeLocalExamples,
} from "@/lib/examples";
import { jyutpingLine } from "@/lib/jyutping";
import { convertText } from "@/lib/convert";
import { SOURCE_LABELS, type Example, type SourceType } from "@/lib/types";

const sourceTypes = Object.keys(SOURCE_LABELS) as SourceType[];

export function LearnBrowser() {
  const localRaw = useSyncExternalStore(
    subscribeLocalExamples,
    readLocalExamplesSnapshot,
    () => "[]",
  );
  const localExamples = useMemo(() => parseLocalExamples(localRaw), [localRaw]);
  const [query, setQuery] = useState("");
  const [cantonese, setCantonese] = useState("");
  const [mandarin, setMandarin] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("user");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const examples = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...localExamples, ...bundledExamples()].filter((example) => {
      if (!needle) return true;
      return [
        example.cantonese,
        example.simplified,
        example.traditional,
        example.jyutping,
        example.mandarinGloss,
        example.sourceTitle,
      ]
        .join("\n")
        .toLowerCase()
        .includes(needle);
    });
  }, [localExamples, query]);

  async function addExample() {
    const spoken = cantonese.trim();
    const gloss = mandarin.trim();
    if (!spoken || !gloss) {
      setFormError("请填写粤语和对应的简体意思。");
      return;
    }
    const [reading, conversion] = await Promise.all([
      jyutpingLine(spoken),
      convertText(gloss),
    ]);
    const next: Example = {
      id: `local-${crypto.randomUUID()}`,
      cantonese: spoken,
      simplified: gloss,
      traditional: conversion.traditional,
      jyutping: reading,
      mandarinGloss: gloss,
      sourceType,
      sourceTitle: sourceTitle.trim() || "本机录入",
      sourceUrl: sourceUrl.trim() || undefined,
      license: "用户自行录入",
      note: note.trim() || undefined,
    };
    writeLocalExamples([next, ...localExamples]);
    setCantonese("");
    setMandarin("");
    setSourceTitle("");
    setSourceUrl("");
    setNote("");
    setFormError("");
  }

  function removeExample(id: string) {
    writeLocalExamples(localExamples.filter((example) => example.id !== id));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">词汇例句</h1>
        <p className="text-sm text-muted">
          内置例句是为本应用写的短句。影视、图书、新闻、博客和社交媒体内容请短句录入，并自己确认可以保存。
        </p>
        <label className="text-sm" htmlFor="example-search">
          搜索
          <input
            id="example-search"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="粤语、简体、粤拼或出处"
          />
        </label>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-semibold">追加一条例句</h2>
        <label className="text-sm">
          粤语
          <input
            className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            value={cantonese}
            onChange={(event) => setCantonese(event.target.value)}
          />
        </label>
        <label className="text-sm">
          简体意思
          <input
            className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            value={mandarin}
            onChange={(event) => setMandarin(event.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            来源类型
            <select
              className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as SourceType)}
            >
              {sourceTypes.map((type) => (
                <option key={type} value={type}>
                  {SOURCE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            作品或页面名称
            <input
              className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
            />
          </label>
        </div>
        <label className="text-sm">
          链接
          <input
            className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://"
          />
        </label>
        <label className="text-sm">
          备注
          <input
            className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {formError ? <p className="text-sm text-accent">{formError}</p> : null}
        <button
          type="button"
          className="w-fit rounded-full bg-accent px-4 py-2 text-sm text-white"
          onClick={() => void addExample()}
        >
          存到这台浏览器
        </button>
      </section>

      <ul className="flex flex-col gap-3">
        {examples.map((example) => {
          const local = example.id.startsWith("local-");
          return (
            <li key={example.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <JyutpingLine key={example.cantonese} text={example.cantonese} />
                  <p className="mt-2 text-sm">{example.mandarinGloss}</p>
                  <p className="mt-2 text-xs text-muted">
                    {SOURCE_LABELS[example.sourceType]} · {example.sourceTitle}
                    {local ? " · 只保存在本机" : ""}
                  </p>
                  {example.note ? <p className="mt-1 text-xs text-muted">{example.note}</p> : null}
                  {example.sourceUrl ? (
                    <a className="mt-1 block text-xs text-accent underline" href={example.sourceUrl}>
                      {example.sourceUrl}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <PlayButton text={example.cantonese} lang="zh-HK" label="粤语" />
                  {local ? (
                    <button
                      type="button"
                      className="text-xs text-muted underline"
                      onClick={() => removeExample(example.id)}
                    >
                      删除
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
