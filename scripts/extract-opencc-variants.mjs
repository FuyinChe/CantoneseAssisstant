import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictDir = path.join(root, "node_modules/opencc-js/dist/esm-lib/dict");
const officialStPath = process.argv[2];

function parseBundled(source) {
  const text = source.replace(/^export default "/, "").replace(/";\s*$/, "");
  return text.split("|").flatMap((pair) => {
    const index = pair.indexOf(" ");
    if (index < 0) return [];
    const from = pair.slice(0, index);
    const to = pair.slice(index + 1);
    return from && to ? [[from, to]] : [];
  });
}

function parseOfficial(text) {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split(/\s+/);
      return [parts[0], parts.slice(1).filter(Boolean)];
    })
    .filter(([from, to]) => from && to.length);
}

class UnionFind {
  constructor() {
    this.parent = new Map();
  }
  add(item) {
    if (!this.parent.has(item)) this.parent.set(item, item);
  }
  find(item) {
    this.add(item);
    const parent = this.parent.get(item);
    if (parent !== item) this.parent.set(item, this.find(parent));
    return this.parent.get(item);
  }
  union(a, b) {
    const left = this.find(a);
    const right = this.find(b);
    if (left !== right) this.parent.set(right, left);
  }
}

function unique(values) {
  return [...new Set(values)];
}

const [stSource, tsSource, hkSource, twSource] = await Promise.all([
  readFile(path.join(dictDir, "STCharacters.js"), "utf8"),
  readFile(path.join(dictDir, "TSCharacters.js"), "utf8"),
  readFile(path.join(dictDir, "HKVariants.js"), "utf8"),
  readFile(path.join(dictDir, "TWVariants.js"), "utf8"),
]);

const st = parseBundled(stSource);
const ts = parseBundled(tsSource);
const hk = parseBundled(hkSource);
const tw = parseBundled(twSource);
const official = officialStPath ? parseOfficial(await readFile(officialStPath, "utf8")) : [];

const uf = new UnionFind();
const officialMulti = official.filter(([, to]) => to.length > 1);
const keys = new Set();

function link(...chars) {
  const items = chars.filter(Boolean);
  for (const char of items) {
    keys.add(char);
    uf.add(char);
  }
  for (let index = 1; index < items.length; index += 1) uf.union(items[0], items[index]);
}

for (const [from, to] of officialMulti) link(from, ...to);
const tsBySimp = new Map();
for (const [trad, simp] of ts) {
  if (!tsBySimp.has(simp)) tsBySimp.set(simp, new Set());
  tsBySimp.get(simp).add(trad);
}
const tsMulti = [...tsBySimp.entries()].filter(([, set]) => set.size > 1);
for (const [simp, trads] of tsMulti) link(simp, ...trads);
for (const [from, to] of hk) link(from, to);
for (const [from, to] of tw) link(from, to);

const buckets = new Map();
for (const char of keys) {
  const rootChar = uf.find(char);
  if (!buckets.has(rootChar)) buckets.set(rootChar, []);
  buckets.get(rootChar).push(char);
}

const stDefault = new Map(st);
function optionsOf(chars) {
  const officialAlts = new Set(officialMulti.flatMap(([from, to]) => (chars.includes(from) ? to : [])));
  const regional = new Set([...hk, ...tw].flat());
  const tsTrads = new Set(tsMulti.flatMap(([simp, set]) => (chars.includes(simp) ? [...set] : [])));
  const picked = chars.filter((char) => officialAlts.has(char) || tsTrads.has(char) || regional.has(char));
  return unique(picked.length ? picked : chars);
}
function sortGroup(chars) {
  const simplified = chars.find((char) => stDefault.has(char));
  const preferred = simplified ? stDefault.get(simplified) : undefined;
  const options = optionsOf(chars);
  return unique(options).sort((left, right) => {
    if (left === preferred) return -1;
    if (right === preferred) return 1;
    return left.localeCompare(right, "zh-Hant");
  });
}

function sourcesOf(chars) {
  const tags = [];
  if (officialMulti.some(([from, to]) => chars.includes(from) || to.some((item) => chars.includes(item)))) tags.push("st");
  if (tsMulti.some(([simp, set]) => chars.includes(simp) || [...set].some((item) => chars.includes(item)))) tags.push("ts");
  if (hk.some((pair) => pair.some((item) => chars.includes(item)))) tags.push("hk");
  if (tw.some((pair) => pair.some((item) => chars.includes(item)))) tags.push("tw");
  return tags;
}

const grouped = [...buckets.values()]
  .map((chars) => ({ members: chars, options: sortGroup(chars), sources: sourcesOf(chars) }))
  .filter((item) => item.options.length > 1)
  .sort((left, right) => right.options.length - left.options.length || left.options.join("").localeCompare(right.options.join(""), "zh-Hant"));

const groups = grouped.map((item) => item.options);
const tagged = grouped.map((item) => ({ options: item.options, sources: item.sources }));
const lookup = {};
for (const item of grouped) {
  for (const char of [...item.members, ...item.options]) lookup[char] = item.options;
}

const payload = {
  generatedFrom: [
    "OpenCC STCharacters (official 1-to-many, if provided)",
    "opencc-js 1.4.2 STCharacters / TSCharacters / HKVariants / TWVariants",
  ],
  counts: {
    officialStEntries: official.length,
    officialStOneToMany: officialMulti.length,
    bundledStEntries: st.length,
    bundledTsEntries: ts.length,
    bundledHkVariants: hk.length,
    bundledTwVariants: tw.length,
    tsReverseManyToOne: tsMulti.length,
    mergedVariantGroups: groups.length,
    charactersInGroups: groups.reduce((sum, group) => sum + group.length, 0),
    sourceCounts: tagged.reduce((hist, item) => {
      const key = item.sources.join("+") || "other";
      hist[key] = (hist[key] ?? 0) + 1;
      return hist;
    }, {}),
  },
  officialFanout: officialMulti.reduce((hist, [, to]) => {
    hist[String(to.length)] = (hist[String(to.length)] ?? 0) + 1;
    return hist;
  }, {}),
  mergedFanout: groups.reduce((hist, group) => {
    hist[String(group.length)] = (hist[String(group.length)] ?? 0) + 1;
    return hist;
  }, {}),
  examples: {
    签: lookup["签"] ?? lookup["籤"],
    床: lookup["床"] ?? lookup["牀"],
    发: lookup["发"],
    里: lookup["里"],
    台: lookup["台"],
    只: lookup["只"],
    干: lookup["干"],
    钟: lookup["钟"],
  },
  groups,
  tagged,
  lookup,
};

await writeFile(path.join(root, "data/opencc-variants.json"), `${JSON.stringify(payload)}\n`);
console.log(JSON.stringify(payload.counts, null, 2));
console.log("fanout official", payload.officialFanout);
console.log("fanout merged", payload.mergedFanout);
console.log("examples", payload.examples);
console.log("groups", groups.length);
