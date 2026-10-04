import type { SpeechLang } from "./types";

export const neuralVoices: Record<
  SpeechLang,
  { name: string; label: string; rate: string; locale: string }
> = {
  "zh-CN": { name: "zh-CN-XiaoxiaoNeural", label: "晓晓 · 普通话", rate: "-8%", locale: "zh-CN" },
  "zh-TW": { name: "zh-TW-HsiaoChenNeural", label: "晓臻 · 国语", rate: "-8%", locale: "zh-TW" },
  "zh-HK": { name: "zh-HK-HiuMaanNeural", label: "晓曼 · 粤语", rate: "-8%", locale: "zh-HK" },
  "en-US": { name: "en-US-AriaNeural", label: "Aria · 英语", rate: "+0%", locale: "en-US" },
};

export function escapeSsml(text: string) {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildSsml(text: string, lang: SpeechLang, xmlLang: string) {
  const voice = neuralVoices[lang];
  return (
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' " +
    `xml:lang='${xmlLang}'>` +
    `<voice name='${voice.name}'>` +
    `<prosody pitch='+0Hz' rate='${voice.rate}' volume='+0%'>` +
    `${escapeSsml(text)}` +
    "</prosody></voice></speak>"
  );
}
