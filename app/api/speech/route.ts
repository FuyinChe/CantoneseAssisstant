import { neuralVoices } from "@/lib/speech/catalog";
import { synthesizeSpeech } from "@/lib/speech/cloud";
import type { SpeechLang } from "@/lib/speech/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const LIMIT = 500;

function isSpeechLang(value: string): value is SpeechLang {
  return value in neuralVoices;
}

export async function POST(request: Request) {
  let body: { text?: unknown; lang?: unknown };
  try {
    body = (await request.json()) as { text?: unknown; lang?: unknown };
  } catch {
    return Response.json({ error: "无法读取要朗读的文字。" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const lang = typeof body.lang === "string" ? body.lang : "";
  if (!text) return Response.json({ error: "没有要朗读的文字。" }, { status: 400 });
  if (!isSpeechLang(lang)) return Response.json({ error: "不认识这个朗读语言。" }, { status: 400 });
  if ([...text].length > LIMIT) {
    return Response.json({ error: "句子太长，请分成较短的句子再朗读。" }, { status: 400 });
  }

  try {
    const audio = await synthesizeSpeech(text, lang);
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "在线语音暂时不可用。";
    return Response.json({ error: message }, { status: 502 });
  }
}
