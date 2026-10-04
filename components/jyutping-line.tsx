"use client";

import { ReadingLine } from "@/components/reading-line";
import { annotate } from "@/lib/jyutping";

export function JyutpingLine({ text }: { text: string }) {
  return <ReadingLine text={text} lang="zh-HK" label="粤拼" load={annotate} />;
}
