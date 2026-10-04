import { translateToEnglish } from "@/lib/translate";

export async function POST(request: Request) {
  let body: { text?: unknown };
  try {
    body = (await request.json()) as { text?: unknown };
  } catch {
    return Response.json({ error: "无法读取要翻译的文字。" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return Response.json({ english: "" });

  try {
    const english = await translateToEnglish(text);
    return Response.json({ english });
  } catch (error) {
    const message = error instanceof Error ? error.message : "英文翻译暂时不可用。";
    return Response.json({ error: message }, { status: 502 });
  }
}
