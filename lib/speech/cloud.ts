import type { SpeechEngine, SpeechLang } from "./types";

/**
 * Reserved cloud speech path. This version does not call Azure or Google
 * and is not imported by the app.
 */
export class CloudSpeech implements SpeechEngine {
  readonly id = "cloud" as const;

  async speak(_text: string, lang: SpeechLang) {
    const provider = process.env.TTS_PROVIDER ?? "unset";
    throw new Error(`云端语音尚未接入（TTS_PROVIDER=${provider}，语言 ${lang}）。`);
  }
}
