const LIMIT = 500;

function readEnglish(data: unknown) {
  if (Array.isArray(data) && data.every((item) => typeof item === "string")) {
    return data.join("").trim();
  }
  if (!Array.isArray(data) || !Array.isArray(data[0])) return "";
  return data[0]
    .map((segment) => (Array.isArray(segment) ? String(segment[0] ?? "") : ""))
    .join("")
    .trim();
}

export async function translateToEnglish(text: string) {
  const source = text.trim();
  if (!source) return "";
  if (source.length > LIMIT) {
    throw new Error("句子太长，请缩短到 500 字以内再翻译。");
  }

  const url = new URL("https://clients5.google.com/translate_a/t");
  url.searchParams.set("client", "dict-chrome-ex");
  url.searchParams.set("sl", "zh-CN");
  url.searchParams.set("tl", "en");
  url.searchParams.set("q", source);

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("英文翻译暂时不可用。");

  const data: unknown = await response.json();
  const english = readEnglish(data);
  if (!english) throw new Error("英文翻译暂时不可用。");
  return english;
}
