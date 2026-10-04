import { buildSsml } from "./catalog";
import type { SpeechLang } from "./types";

export async function synthesizeAzure(text: string, lang: SpeechLang) {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim() || "eastasia";
  if (!key) throw new Error("还没有配置微软语音密钥。");

  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "cantonese-assistant",
    },
    body: buildSsml(text, lang, lang),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("微软语音暂时不可用。");
  return Buffer.from(await response.arrayBuffer());
}
