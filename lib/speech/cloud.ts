import { synthesizeAzure } from "./azure";
import { synthesizeEdge } from "./edge";
import type { SpeechLang } from "./types";

export function speechProvider() {
  const provider = (process.env.TTS_PROVIDER ?? "edge").trim().toLowerCase();
  if (provider === "azure" || provider === "browser") return provider;
  return "edge";
}

export async function synthesizeSpeech(text: string, lang: SpeechLang) {
  const provider = speechProvider();
  if (provider === "azure") return synthesizeAzure(text, lang);
  if (provider === "browser") throw new Error("当前设置为只使用本机语音。");
  return synthesizeEdge(text, lang);
}
