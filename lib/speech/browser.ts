import type { SpeechEngine, SpeechLang } from "./types";

function normalizeLang(lang: string) {
  return lang.toLowerCase().replaceAll("_", "-");
}

export function voiceMatches(voiceLang: string, lang: SpeechLang) {
  const normalized = normalizeLang(voiceLang);
  if (lang === "zh-HK") {
    return normalized.startsWith("zh-hk") || normalized.startsWith("yue");
  }
  if (lang === "zh-TW") return normalized.startsWith("zh-tw");
  if (lang === "en-US") return normalized.startsWith("en");
  return normalized.startsWith("zh-cn") || normalized.startsWith("zh-hans");
}

export function matchingVoices(lang: SpeechLang) {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().filter((voice) => voiceMatches(voice.lang, lang));
}

export function findVoice(lang: SpeechLang) {
  const voices = matchingVoices(lang);
  if (lang === "zh-HK") {
    return (
      voices.find((voice) => /sinji/i.test(voice.name)) ??
      voices.find((voice) => normalizeLang(voice.lang).startsWith("yue")) ??
      voices[0] ??
      null
    );
  }
  if (lang === "zh-TW") {
    return voices.find((voice) => /meijia|mei-jia/i.test(voice.name)) ?? voices[0] ?? null;
  }
  if (lang === "en-US") {
    const american = voices.filter((voice) => normalizeLang(voice.lang).startsWith("en-us"));
    return (
      american.find((voice) => /samantha|alex/i.test(voice.name)) ??
      american[0] ??
      voices[0] ??
      null
    );
  }
  return voices.find((voice) => /tingting|ting-ting/i.test(voice.name)) ?? voices[0] ?? null;
}

export class BrowserSpeech implements SpeechEngine {
  readonly id = "browser" as const;

  speak(text: string, lang: SpeechLang) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return Promise.reject(new Error("这部浏览器没有语音合成。"));
    }
    const spoken = text.trim();
    if (!spoken) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const synthesis = window.speechSynthesis;
      synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spoken);
      const voice = findVoice(lang);
      utterance.lang = voice?.lang || lang;
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("播放失败。"));
      synthesis.speak(utterance);
    });
  }
}
