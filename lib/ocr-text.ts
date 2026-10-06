/** Post-process OCR text: keep script as-is, drop textbook pinyin rows, spare English. */

const HAN = /\p{Script=Han}/u;
const TONE_MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ]/u;
const LATIN_RUN =
  /(?:[A-Za-z]|[àáǎāèéěēìíǐīòóǒōùúǔūüǖǘǚǜńňǹ]|[ÀÁǍĀÈÉĚĒÌÍǏĪÒÓǑŌÙÚǓŪÜǕǗǙǛ]|v|ü|Ü)+[1-5]?(?:['’][A-Za-z]+)?/gu;

const ENGLISH_HINT =
  /\b(?:the|and|or|is|are|was|were|be|been|being|to|of|in|on|for|with|as|at|by|from|that|this|these|those|it|its|it's|a|an|not|but|they|them|you|your|we|our|he|she|my|his|her|have|has|had|do|does|did|will|would|can|could|should|may|might|about|into|over|after|before|between|through|during|without|within|because|while|where|when|what|which|who|how|than|then|also|just|only|very|more|most|some|any|all|each|every|both|other|such|same|own|new|old|good|great|first|last|long|little|much|many|few|one|two|three|four|five|six|seven|eight|nine|ten|hello|world|please|thanks|thank|yes|no|ok|okay)\b/i;

/** Common Mandarin syllable shapes (initial optional + final), optional tone digit. */
const PINYIN_SYLLABLE =
  /^(?:[bpmfdtnlgkhjqxzcsryw]|zh|ch|sh|ng)?(?:i|u|ü|v|a|o|e|ê|ai|ei|ao|ou|an|en|ang|eng|ong|er|ia|iao|ie|iu|ian|in|iang|ing|iong|ua|uo|uai|ui|uan|un|uang|ueng|üe|ue|üan|ün|ng|n|m)?[1-5]?$/i;

function hasHan(text: string) {
  return HAN.test(text);
}

function latinTokens(text: string) {
  return text.match(LATIN_RUN) ?? [];
}

function stripToneMarks(token: string) {
  return token
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/ü/gi, "v")
    .toLowerCase();
}

function isStrongPinyinToken(token: string) {
  if (/^[0-9]+$/.test(token)) return false;
  if (TONE_MARK.test(token)) {
    const plain = stripToneMarks(token);
    return plain.length <= 7 && PINYIN_SYLLABLE.test(plain);
  }
  if (/^[a-züv]{1,6}[1-5]$/i.test(token)) {
    return PINYIN_SYLLABLE.test(token.toLowerCase());
  }
  return false;
}

function isWeakPinyinToken(token: string) {
  if (isStrongPinyinToken(token)) return true;
  if (token.length > 6) return false;
  if (/[^a-züv]/i.test(token)) return false;
  return PINYIN_SYLLABLE.test(token.toLowerCase());
}

function looksLikeEnglish(text: string, tokens: string[]) {
  if (ENGLISH_HINT.test(text)) return true;
  if (tokens.some((token) => token.length >= 8 && !TONE_MARK.test(token) && !/[1-5]$/.test(token))) {
    return true;
  }
  // Apostrophe contractions are almost never pinyin.
  if (/[A-Za-z]+['’][A-Za-z]+/.test(text)) return true;
  return false;
}

/** Whole line is textbook-style pinyin (no Chinese, not English). */
export function isLikelyPinyinLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || hasHan(trimmed)) return false;
  const tokens = latinTokens(trimmed);
  if (tokens.length === 0) return false;

  const strong = tokens.filter(isStrongPinyinToken).length;
  const weak = tokens.filter(isWeakPinyinToken).length;
  const letters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  const compact = trimmed.replace(/\s+/g, "");
  const letterHeavy = letters >= 4 && letters / Math.max(compact.length, 1) >= 0.55;
  // One glued mixed-case blob (VOUmIaodrmama) is pinyin OCR, not an English word.
  if (
    tokens.length === 1 &&
    letterHeavy &&
    tokens[0].length >= 8 &&
    !/^[A-Z]?[a-z]+$/.test(tokens[0]) &&
    !isBrandLikeLatin(tokens[0])
  ) {
    return true;
  }
  // Real English sentences — but allow short words like "you"/"to" inside pinyin rows.
  const englishSentence =
    looksLikeEnglish(trimmed, tokens) &&
    !(tokens.length >= 3 && (weak + strong) / tokens.length >= 0.5) &&
    !(tokens.length >= 3 && letterHeavy && tokens.every((token) => token.length <= 7));
  if (englishSentence) return false;

  if (strong >= 1 && strong / tokens.length >= 0.5) return true;
  if (strong >= 2) return true;
  // Tone-less rows only when almost every token looks like a short syllable.
  if (tokens.length >= 2 && weak === tokens.length && tokens.every((token) => token.length <= 6)) {
    return true;
  }
  // Garbled OCR of pinyin rows (Gu ding you mc nou / por wonc_ you migo…).
  // Require multiple short tokens so brands like "iPhone 15" stay.
  if (tokens.length >= 3 && letterHeavy && tokens.every((token) => token.length <= 8)) {
    // Keep clear English sentences; ignore function-word hits like you/to/a
    // that also appear inside pinyin OCR junk.
    if (
      /\b(?:this|that|these|those|book|hello|world|please|thanks|thank|have|has|been|with|from|about|would|could|should|what|which|where|when)\b/i.test(
        trimmed,
      )
    ) {
      return false;
    }
    return true;
  }
  return false;
}

/** Collapse OCR gaps between Han; keep spaces around Latin / English runs. */
export function cleanOcrLine(line: string) {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/^[0-9]+(?=\p{Script=Han})/u, "")
    .replace(/(?<=\p{Script=Han})\s+(?=\p{Script=Han})/gu, "")
    .replace(/(?<=\p{Script=Han})\s+(?=[，。！？；：、“”‘’（）【】《》…—·、])/gu, "")
    .replace(/(?<=[，。！？；：、“”‘’（）【】《》…—·、])\s+(?=\p{Script=Han})/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isBrandLikeLatin(token: string) {
  // iPhone / iPad, and short acronyms (OCR, OK). Random internal capitals
  // (miaohouW, rruZaIhuang) are pinyin OCR, not brands.
  if (/^i[A-Z][A-Za-z0-9]{2,}$/.test(token)) return true;
  if (/^[A-Z]{2,6}$/.test(token)) return true;
  return false;
}

function shouldStripLatinOnHanLine(token: string) {
  if (isBrandLikeLatin(token)) return false;
  if (ENGLISH_HINT.test(token)) return false;
  if (/[A-Za-z]+['’][A-Za-z]+/.test(token)) return false;
  if (isStrongPinyinToken(token) || isWeakPinyinToken(token)) return true;
  const plain = stripToneMarks(token).replace(/[1-5]$/, "");
  // Glued textbook pinyin, including tone marks and mixed-case OCR (miaohouW, CUIselude…).
  if (plain.length <= 40 && /^[a-z]+$/i.test(plain)) return true;
  return false;
}

/**
 * On a Chinese line, drop leading/trailing strong-pinyin ruby tokens that OCR
 * glued onto the same row. Never strip English-looking Latin.
 */
export function stripAdjacentPinyinRubies(line: string) {
  if (!hasHan(line)) return line;
  const parts = line.split(/(\s+)/);
  const isGap = (part: string) => /^\s+$/.test(part);

  let start = 0;
  while (start < parts.length) {
    const part = parts[start];
    if (isGap(part)) {
      start += 1;
      continue;
    }
    const tokens = latinTokens(part);
    if (
      tokens.length > 0 &&
      !hasHan(part) &&
      !looksLikeEnglish(part, tokens) &&
      tokens.every((token) => isStrongPinyinToken(token) || isWeakPinyinToken(token))
    ) {
      start += 1;
      continue;
    }
    break;
  }

  let end = parts.length;
  while (end > start) {
    const part = parts[end - 1];
    if (isGap(part)) {
      end -= 1;
      continue;
    }
    const tokens = latinTokens(part);
    if (
      tokens.length > 0 &&
      !hasHan(part) &&
      !looksLikeEnglish(part, tokens) &&
      tokens.every((token) => isStrongPinyinToken(token) || isWeakPinyinToken(token))
    ) {
      end -= 1;
      continue;
    }
    break;
  }

  return parts.slice(start, end).join("").replace(/[ \t]{2,}/g, " ").trim();
}

/**
 * Remove inline pinyin / OCR latin noise from Han-heavy lines.
 * Preserves English words and brand-like tokens (iPhone, OK, …).
 */
export function stripInlinePinyinNoise(line: string) {
  if (!hasHan(line)) return line;
  const hanCount = (line.match(/\p{Script=Han}/gu) ?? []).length;
  if (hanCount < 1) return line;

  return line
    .replace(LATIN_RUN, (token) => (shouldStripLatinOnHanLine(token) ? "" : token))
    .replace(/[\u3040-\u30ff]+/g, "")
    .replace(/[()（）[\]×*]*\d+[()（）[\]×*\d]*/g, "")
    .replace(/[()（）[\]×*]{2,}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/(?<=\p{Script=Han})\s+(?=\p{Script=Han})/gu, "")
    .trim();
}

export function filterPinyinLines(lines: string[]) {
  const kept: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      kept.push(line);
      continue;
    }
    if (!isLikelyPinyinLine(line)) {
      kept.push(line);
      continue;
    }
    const laterHan = lines.slice(index + 1).some((item) => item.trim() && hasHan(item));
    const earlierHan = kept.some((item) => item.trim() && hasHan(item));
    // Textbook rows sit above (or rarely between) character lines.
    if (laterHan || earlierHan) continue;
    kept.push(line);
  }
  return kept;
}

const PUNCT = /[，。！？；：、“”‘’「」『』（）【】《》…—·、,.!?;:'"()[\]{}<>\/\\|~`^*_=+\-]/g;

/** Drop lines that are almost only OCR junk (digits, slashes) once real Han exists. */
export function dropSparseJunkLines(lines: string[]) {
  const meaningful = lines.filter((line) => (line.match(/\p{Script=Han}/gu) ?? []).length >= 4);
  if (meaningful.length === 0) return lines;

  return lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const han = (trimmed.match(/\p{Script=Han}/gu) ?? []).length;
    if (looksLikeEnglish(trimmed, latinTokens(trimmed))) return true;
    const letters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
    const digits = (trimmed.match(/[0-9]/g) ?? []).length;
    const stripped = trimmed.replace(PUNCT, "").replace(/\s+/g, "");
    const other = Math.max(0, stripped.length - han);
    const weird = (trimmed.match(/[~#*|\\/<>_=^]/g) ?? []).length;
    // Short scraps next to real sentences (拼音残留 / 半截字).
    // Pure Han stays: a real line can be as short as 地成長, and a lone 我 is still text.
    if (weird >= 1 && han <= 6 && meaningful.length >= 1) return false;
    if (han <= 3 && other >= 2 && meaningful.length >= 1) return false;
    if (han >= 1 && other === 0) return true;
    if (han >= 4) return true;
    if (han === 0 && letters + digits >= stripped.length * 0.5) return false;
    if (han <= 2 && stripped.length <= 8 && letters + digits >= 2) return false;
    return han > 0;
  });
}

/** Normalize OCR output without flipping simplified/traditional glyphs. */
export function cleanOcrText(raw: string) {
  if (!raw.trim()) return "";
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => stripInlinePinyinNoise(stripAdjacentPinyinRubies(cleanOcrLine(line))));
  return dropSparseJunkLines(filterPinyinLines(lines))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
