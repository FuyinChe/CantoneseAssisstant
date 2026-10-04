"use client";

import { ReadingLine } from "@/components/reading-line";
import { annotatePinyin } from "@/lib/pinyin";

export function PinyinLine({ text, marks }: { text: string; marks?: boolean[] }) {
  return <ReadingLine text={text} lang="zh-CN" label="拼音" load={annotatePinyin} marks={marks} />;
}
