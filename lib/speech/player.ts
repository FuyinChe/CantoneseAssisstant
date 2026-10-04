import { BrowserSpeech } from "./browser";
import type { SpeechEngine, SpeechLang } from "./types";

class LearningSpeech implements SpeechEngine {
  readonly id = "cloud" as const;
  private readonly browser = new BrowserSpeech();
  private audio: HTMLAudioElement | null = null;
  private url: string | null = null;
  private controller: AbortController | null = null;
  private request = 0;

  private stopAudio() {
    const audio = this.audio;
    this.audio = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
    }
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
  }

  private play(blob: Blob, request: number) {
    this.stopAudio();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    this.audio = audio;
    this.url = url;
    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        if (request === this.request) this.stopAudio();
        resolve();
      };
      audio.onerror = () => {
        if (request === this.request) this.stopAudio();
        reject(new Error("播放失败。"));
      };
      void audio.play().catch((error: Error) => {
        if (request === this.request) this.stopAudio();
        reject(error);
      });
    });
  }

  async speak(text: string, lang: SpeechLang) {
    const spoken = text.trim();
    if (!spoken) return;
    const request = ++this.request;
    this.controller?.abort();
    this.stopAudio();
    window.speechSynthesis?.cancel();
    const controller = new AbortController();
    this.controller = controller;

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spoken, lang }),
        signal: controller.signal,
      });
      if (request !== this.request) return;
      const type = response.headers.get("content-type") ?? "";
      if (!response.ok || !type.includes("audio")) throw new Error("在线语音暂时不可用。");
      const blob = await response.blob();
      if (request !== this.request) return;
      await this.play(blob, request);
    } catch (error) {
      if (request !== this.request || (error instanceof DOMException && error.name === "AbortError")) return;
      try {
        await this.browser.speak(spoken, lang);
      } catch {
        throw new Error("播放失败。");
      }
      throw new Error("在线语音暂时不可用，已改用本机语音。");
    }
  }
}

export const learningSpeech = new LearningSpeech();
