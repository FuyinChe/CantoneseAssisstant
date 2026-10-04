import { annotatePinyin } from "./pinyin";
import type { JyutpingToken } from "./jyutping";

const TONE_VOWELS: Record<string, [string, string]> = {
  ā: ["a", "1"],
  á: ["a", "2"],
  ǎ: ["a", "3"],
  à: ["a", "4"],
  ē: ["e", "1"],
  é: ["e", "2"],
  ě: ["e", "3"],
  è: ["e", "4"],
  ī: ["i", "1"],
  í: ["i", "2"],
  ǐ: ["i", "3"],
  ì: ["i", "4"],
  ō: ["o", "1"],
  ó: ["o", "2"],
  ǒ: ["o", "3"],
  ò: ["o", "4"],
  ū: ["u", "1"],
  ú: ["u", "2"],
  ǔ: ["u", "3"],
  ù: ["u", "4"],
  ǖ: ["ü", "1"],
  ǘ: ["ü", "2"],
  ǚ: ["ü", "3"],
  ǜ: ["ü", "4"],
  ń: ["n", "2"],
  ň: ["n", "3"],
  ǹ: ["n", "4"],
};

const TONE_MARKS: Record<string, string> = {
  "1": "",
  "2": "ˊ",
  "3": "ˇ",
  "4": "ˋ",
  "5": "˙",
};

const INITIALS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s"];

const INITIAL_TO_ZHUYIN: Record<string, string> = {
  b: "ㄅ",
  p: "ㄆ",
  m: "ㄇ",
  f: "ㄈ",
  d: "ㄉ",
  t: "ㄊ",
  n: "ㄋ",
  l: "ㄌ",
  g: "ㄍ",
  k: "ㄎ",
  h: "ㄏ",
  j: "ㄐ",
  q: "ㄑ",
  x: "ㄒ",
  zh: "ㄓ",
  ch: "ㄔ",
  sh: "ㄕ",
  r: "ㄖ",
  z: "ㄗ",
  c: "ㄘ",
  s: "ㄙ",
};

const FINAL_TO_ZHUYIN: Record<string, string> = {
  "": "",
  a: "ㄚ",
  o: "ㄛ",
  e: "ㄜ",
  ai: "ㄞ",
  ei: "ㄟ",
  ao: "ㄠ",
  ou: "ㄡ",
  an: "ㄢ",
  en: "ㄣ",
  ang: "ㄤ",
  eng: "ㄥ",
  er: "ㄦ",
  i: "ㄧ",
  ia: "ㄧㄚ",
  ie: "ㄧㄝ",
  iao: "ㄧㄠ",
  iu: "ㄧㄡ",
  iou: "ㄧㄡ",
  ian: "ㄧㄢ",
  in: "ㄧㄣ",
  iang: "ㄧㄤ",
  ing: "ㄧㄥ",
  io: "ㄧㄛ",
  u: "ㄨ",
  ua: "ㄨㄚ",
  uo: "ㄨㄛ",
  uai: "ㄨㄞ",
  ui: "ㄨㄟ",
  uei: "ㄨㄟ",
  uan: "ㄨㄢ",
  un: "ㄨㄣ",
  uen: "ㄨㄣ",
  uang: "ㄨㄤ",
  ong: "ㄨㄥ",
  ü: "ㄩ",
  üe: "ㄩㄝ",
  üan: "ㄩㄢ",
  ün: "ㄩㄣ",
  iong: "ㄩㄥ",
};

const ZHI_INITIALS = new Set(["zh", "ch", "sh", "r", "z", "c", "s"]);
const JQX = new Set(["j", "q", "x"]);

function stripTone(syllable: string) {
  let tone = "5";
  let plain = "";
  for (const char of syllable) {
    const mapped = TONE_VOWELS[char];
    if (mapped) {
      plain += mapped[0];
      tone = mapped[1];
    } else {
      plain += char;
    }
  }
  return { plain: plain.replaceAll("v", "ü").toLowerCase(), tone };
}

function rewriteFinal(initial: string, final: string) {
  let next = final;
  if (!initial) {
    if (next.startsWith("yu")) next = `ü${next.slice(2)}`;
    else if (next === "you") next = "iu";
    else if (next === "yong") next = "iong";
    else if (next === "yo") next = "io";
    else if (next.startsWith("y")) {
      const rest = next.slice(1);
      next = rest.startsWith("i") ? rest : `i${rest}`;
    } else if (next === "weng") next = "ong";
    else if (next.startsWith("w")) {
      const rest = next.slice(1);
      next = rest === "u" ? "u" : `u${rest}`;
      if (next === "uei") next = "ui";
      if (next === "uen") next = "un";
    }
  }
  if (JQX.has(initial) && next.startsWith("u")) next = `ü${next.slice(1)}`;
  if (ZHI_INITIALS.has(initial) && next === "i") next = "";
  return next;
}

export function pinyinToZhuyin(syllable: string) {
  if (!syllable || !/[a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜńňǹv]/i.test(syllable)) return "";
  const { plain, tone } = stripTone(syllable);
  const mark = TONE_MARKS[tone] ?? "";
  if (plain === "m" || plain === "n" || plain === "ng") {
    const body = plain === "m" ? "ㄇ" : plain === "ng" ? "ㄫ" : "ㄣ";
    return tone === "5" ? `˙${body}` : `${body}${mark}`;
  }

  let initial = "";
  let rest = plain;
  for (const item of INITIALS) {
    if (plain.startsWith(item) && plain.length > item.length) {
      initial = item;
      rest = plain.slice(item.length);
      break;
    }
  }

  const final = rewriteFinal(initial, rest);
  if (!(final in FINAL_TO_ZHUYIN)) return "";
  const body = `${INITIAL_TO_ZHUYIN[initial] ?? ""}${FINAL_TO_ZHUYIN[final]}`;
  if (!body) return "";
  return tone === "5" ? `˙${body}` : `${body}${mark}`;
}

export async function annotateZhuyin(text: string, simplified = text): Promise<JyutpingToken[]> {
  if (!text) return [];
  const displayed = Array.from(text);
  const sourceChars = Array.from(simplified);
  const source = sourceChars.length === displayed.length ? simplified : text;
  const tokens = await annotatePinyin(source);
  return displayed.map((char, index) => {
    const seen = new Set<string>();
    const readings: string[] = [];
    for (const item of tokens[index]?.readings ?? []) {
      const zhuyin = pinyinToZhuyin(item);
      if (!zhuyin || seen.has(zhuyin)) continue;
      seen.add(zhuyin);
      readings.push(zhuyin);
    }
    return { text: char, readings };
  });
}
