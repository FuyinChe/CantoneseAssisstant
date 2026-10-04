import { createReadStream } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import * as OpenCC from "opencc-js";
import { getJyutpingText } from "to-jyutping";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "data", "raw");
const toHk = OpenCC.Converter({ from: "cn", to: "hk" });

const PHRASE_IMPORT_CAP = 4000;
const WORDS_HK_EXAMPLE_CAP = 250;
const CC_CANTO_EXAMPLE_CAP = 200;

function cleanWordsHkText(value) {
  return value
    .replace(/\s*\([^)]*\)\s*$/u, "")
    .replaceAll("#", "")
    .replace(/\s+/gu, "")
    .trim();
}

function hanCount(value) {
  return [...value].filter((char) => /\p{Script=Han}/u.test(char)).length;
}

export function extractWordsHk(entryText) {
  const sim = [...entryText.matchAll(/\(sim:([^)]+)\)/gu)].map((match) => match[1].trim());
  const examples = [];
  for (const block of entryText.split(/^----$/m)) {
    const zho = [...block.matchAll(/^zho:(.*)$/gm)].map((match) => cleanWordsHkText(match[1]));
    const yue = [...block.matchAll(/^yue:(.*)$/gm)].map((match) => cleanWordsHkText(match[1]));
    const count = Math.min(zho.length, yue.length);
    for (let index = 0; index < count; index += 1) {
      if (hanCount(zho[index]) >= 2 && hanCount(yue[index]) >= 2 && yue[index].length <= 40) {
        examples.push({ simplified: zho[index], cantonese: yue[index] });
      }
    }
  }
  return { sim, examples };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function readDump(filePath) {
  const bytes = await readFile(filePath);
  const text = filePath.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : bytes.toString("utf8");
  return text;
}

async function findRawFile(pattern) {
  let names = [];
  try {
    names = await readdir(rawDir);
  } catch {
    return null;
  }
  const match = names.find((name) => pattern.test(name) && name !== ".gitkeep");
  return match ? path.join(rawDir, match) : null;
}

function pushPhrase(target, seen, entry) {
  const from = toHk(entry.from.trim());
  const to = toHk(entry.to.trim());
  if (!from || !to || seen.has(from)) return false;
  seen.add(from);
  target.push({ from, to });
  return true;
}

function makeExample(partial) {
  const traditional = toHk(partial.simplified);
  return {
    id: partial.id,
    traditional,
    simplified: partial.simplified,
    cantonese: partial.cantonese,
    jyutping: getJyutpingText(partial.cantonese),
    mandarinGloss: partial.mandarinGloss,
    sourceType: partial.sourceType,
    sourceTitle: partial.sourceTitle,
    sourceUrl: partial.sourceUrl,
    license: partial.license,
    note: partial.note,
  };
}

async function importWordsHk(phrases, seen, examples) {
  const filePath = await findRawFile(/^(all|words-hk).*\.csv(\.gz)?$/i);
  if (!filePath) {
    console.log("未找到粤典 CSV（data/raw/all.csv 或 all.csv.gz）。跳过粤典导入。");
    return;
  }
  const rows = parseCsv(await readDump(filePath));
  let phraseCount = 0;
  let exampleCount = 0;
  for (const row of rows) {
    if (row.length < 6 || !/^\d+$/.test(row[0] ?? "")) continue;
    const [, headword = "", entry = "", , warning = "", visibility = ""] = row;
    if (!visibility.includes("已公開") || (warning && warning !== "OK")) continue;
    const cantonese = headword.split(",")[0]?.split(":")[0]?.trim() ?? "";
    const extracted = extractWordsHk(entry);
    if (phraseCount < PHRASE_IMPORT_CAP) {
      for (const sim of extracted.sim) {
        if (sim.length < 2 || sim.length > 12) continue;
        if (pushPhrase(phrases, seen, { from: sim, to: cantonese })) {
          phraseCount += 1;
          if (phraseCount >= PHRASE_IMPORT_CAP) break;
        }
      }
    }
    if (exampleCount < WORDS_HK_EXAMPLE_CAP) {
      for (const pair of extracted.examples) {
        examples.push(
          makeExample({
            id: `words-hk-${row[0]}-${exampleCount + 1}`,
            simplified: pair.simplified,
            cantonese: pair.cantonese,
            mandarinGloss: pair.simplified,
            sourceType: "dictionary",
            sourceTitle: "粤典 words.hk",
            sourceUrl: "https://words.hk/",
            license: "非商业开放资料授权协议 1.0",
            note: "由粤典词条中的普通话与粤语对照抽出。个人非商业使用，需署名。",
          }),
        );
        exampleCount += 1;
        if (exampleCount >= WORDS_HK_EXAMPLE_CAP) break;
      }
    }
  }
  console.log(`粤典：导入 ${phraseCount} 条对照、${exampleCount} 条例句。来源 ${path.basename(filePath)}`);
}

async function importCcCanto(examples) {
  const filePath = await findRawFile(/^cc-?canto.*\.txt$/i);
  if (!filePath) {
    console.log("未找到 CC-Canto（data/raw/cccanto.txt）。跳过。");
    return;
  }
  let count = 0;
  const lines = createInterface({ input: createReadStream(filePath, "utf8"), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line || line.startsWith("#") || count >= CC_CANTO_EXAMPLE_CAP) continue;
    const match = line.match(/^(\S+)\s+(\S+)\s+\[[^\]]*\]\s+\{([^}]*)\}\s+\/(.+)\/\s*$/u);
    if (!match) continue;
    const [, traditional, simplified, jyutping, gloss] = match;
    if (hanCount(traditional) < 1 || traditional.length > 8) continue;
    examples.push({
      id: `cc-canto-${count + 1}`,
      traditional,
      simplified,
      cantonese: traditional,
      jyutping: jyutping.trim(),
      mandarinGloss: gloss.split("/")[0]?.trim() || simplified,
      sourceType: "dictionary",
      sourceTitle: "CC-Canto",
      sourceUrl: "https://cccanto.org/",
      license: "CC BY-SA 3.0",
      note: "英文释义来自 CC-Canto。再分发时需署名并保持相同共享方式。",
    });
    count += 1;
  }
  console.log(`CC-Canto：导入 ${count} 条词条。`);
}

function selfTest() {
  const sample = `(pos:詞綴)(label:書面語)
zho:他們正説着話呢。 (taa1 mun4)
yue:佢哋講緊嘢啊。 (keoi5 dei6 gong2 gan2 je5 aa3.)
eng:They are talking.`;
  const extracted = extractWordsHk("(pos:動詞)(sim:挑選)(sim:選擇)\n" + sample);
  if (!extracted.sim.includes("挑選") || extracted.examples.length !== 1) {
    throw new Error("粤典解析自测失败");
  }
  if (extracted.examples[0].cantonese !== "佢哋講緊嘢啊。") {
    throw new Error(`例句清洗失败：${extracted.examples[0].cantonese}`);
  }
  console.log("粤典解析自测通过。");
}

async function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const manualPhrases = JSON.parse(
    await readFile(path.join(root, "data", "phrase-map.manual.json"), "utf8"),
  );
  const manualExamples = JSON.parse(
    await readFile(path.join(root, "data", "examples.manual.json"), "utf8"),
  );

  const phrases = [];
  const seen = new Set();
  for (const entry of manualPhrases.entries) {
    pushPhrase(phrases, seen, entry);
  }

  const examples = manualExamples.examples.map((example) =>
    makeExample({
      ...example,
      mandarinGloss: example.mandarinGloss || example.simplified,
    }),
  );

  await importWordsHk(phrases, seen, examples);
  await importCcCanto(examples);

  await writeFile(
    path.join(root, "data", "phrase-map.json"),
    `${JSON.stringify({ entries: phrases }, null, 2)}\n`,
  );
  await writeFile(
    path.join(root, "data", "examples.json"),
    `${JSON.stringify({ examples }, null, 2)}\n`,
  );
  console.log(`写出 ${phrases.length} 条对照、${examples.length} 条例句。`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
