"use client";

import { useCallback } from "react";
import { ReadingLine } from "@/components/reading-line";
import { annotateZhuyin } from "@/lib/zhuyin";

export function ZhuyinLine({
  text,
  simplified,
  marks,
}: {
  text: string;
  simplified: string;
  marks?: boolean[];
}) {
  const load = useCallback((value: string) => annotateZhuyin(value, simplified), [simplified]);
  return <ReadingLine text={text} lang="zh-TW" label="注音" load={load} marks={marks} />;
}
