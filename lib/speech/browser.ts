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

const quietVoices = new Set<string>();
const voiceListeners = new Set<() => void>();
let speechGeneration = 0;

const preferredNames: Record<SpeechLang, RegExp[]> = {
  "zh-CN": [/sandy/i, /shelley/i, /flo/i, /eddy/i, /tingting|ting-ting/i],
  "zh-HK": [/sinji|sin-ji/i],
  "zh-TW": [/sandy/i, /shelley/i, /flo/i, /eddy/i, /meijia|mei-jia/i],
  "en-US": [/samantha/i, /alex/i],
};

const speechRate: Record<SpeechLang, number> = {
  "zh-CN": 0.72,
  "zh-TW": 0.72,
  "zh-HK": 0.78,
  "en-US": 0.9,
};

function clauses(text: string) {
  const parts = text
    .split(/(?<=[。！？!?；;，,、])/u)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

function voiceKey(voice: SpeechSynthesisVoice) {
  return voice.voiceURI || voice.name;
}

function rank(lang: SpeechLang, voice: SpeechSynthesisVoice) {
  const index = preferredNames[lang].findIndex((pattern) => pattern.test(voice.name));
  return index === -1 ? preferredNames[lang].length : index;
}

export function onVoicesChanged(listener: () => void) {
  voiceListeners.add(listener);
  return () => voiceListeners.delete(listener);
}

export function findVoice(lang: SpeechLang) {
  let voices = matchingVoices(lang).filter((voice) => !quietVoices.has(voiceKey(voice)));
  if (lang === "en-US") {
    const american = voices.filter((voice) => normalizeLang(voice.lang).startsWith("en-us"));
    if (american.length > 0) voices = american;
  }
  return [...voices].sort((a, b) => rank(lang, a) - rank(lang, b))[0] ?? null;
}

export class BrowserSpeech implements SpeechEngine {
  readonly id = "browser" as const;

  speak(text: string, lang: SpeechLang) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return Promise.reject(new Error("这部浏览器没有语音合成。"));
    }
    const spoken = text.trim();
    if (!spoken) return Promise.resolve();

    const generation = ++speechGeneration;
    return new Promise<void>((resolve, reject) => {
      const synthesis = window.speechSynthesis;
      let settled = false;
      let allowUnassigned = true;
      const succeed = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        reject(new Error("播放失败。"));
      };
      const pieces = clauses(spoken);
      let pieceIndex = 0;
      const speakNext = () => {
        if (settled || generation !== speechGeneration) {
          succeed();
          return;
        }
        const voice = findVoice(lang);
        if (!voice && !allowUnassigned) {
          fail();
          return;
        }
        if (!voice) allowUnassigned = false;
        const utterance = new SpeechSynthesisUtterance(pieces[pieceIndex] ?? spoken);
        utterance.lang = voice?.lang || lang;
        utterance.rate = speechRate[lang];
        if (voice) utterance.voice = voice;
        const started = performance.now();
        utterance.onend = () => {
          const piece = pieces[pieceIndex] ?? spoken;
          const han = [...piece].filter((char) => /\p{Script=Han}/u.test(char)).length;
          const tooFast = han > 0 && performance.now() - started < 160;
          if (tooFast && voice && !settled && generation === speechGeneration) {
            quietVoices.add(voiceKey(voice));
            voiceListeners.forEach((listener) => listener());
            pieceIndex = 0;
            speakNext();
            return;
          }
          if (tooFast && !voice) {
            fail();
            return;
          }
          pieceIndex += 1;
          if (pieceIndex < pieces.length && generation === speechGeneration) {
            window.setTimeout(speakNext, 220);
            return;
          }
          succeed();
        };
        utterance.onerror = (event) => {
          if (event.error === "interrupted" || event.error === "canceled") {
            succeed();
            return;
          }
          fail();
        };
        synthesis.speak(utterance);
      };
      if (synthesis.speaking || synthesis.pending) {
        synthesis.cancel();
        window.setTimeout(speakNext, 60);
      } else {
        speakNext();
      }
    });
  }
}
