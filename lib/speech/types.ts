export type SpeechLang = "zh-CN" | "zh-HK" | "zh-TW" | "en-US";

export interface SpeechEngine {
  readonly id: "browser" | "cloud";
  speak(text: string, lang: SpeechLang): Promise<void>;
}
