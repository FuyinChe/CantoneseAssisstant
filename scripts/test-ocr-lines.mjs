import { linesFromBoxes } from "../lib/ocr-lines.ts";

function box(text, x, y, w, h, score = 0.9) {
  return {
    text,
    score,
    poly: [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
  };
}

const han = ["盼", "望", "幼", "苗", "能", "夠", "越", "長", "越", "高"];
const next = ["有", "一", "天", "在", "翠", "綠", "的", "葉", "子", "旁"];
const items = [
  ...han.map((text, i) => box(text, 40 + i * 48, 200, 40, 44)),
  ...next.map((text, i) => box(text, 48 + i * 48, 280, 40, 44)),
  box("pàn wàng", 40, 168, 90, 18),
  box("yǒu", 48, 250, 36, 16),
];

const got = linesFromBoxes(items);
const expect = `${han.join("")}\n${next.join("")}`;
if (got !== expect) {
  console.log("FAIL interleaved\n", JSON.stringify(got), "\nwant\n", JSON.stringify(expect));
  process.exit(1);
}

const same = linesFromBoxes([
  box("固", 10, 100, 40, 42),
  box("定", 52, 104, 40, 42),
  box("幼", 94, 98, 40, 42),
]);
if (same !== "固定幼") {
  console.log("FAIL same line", JSON.stringify(same));
  process.exit(1);
}

const bands = [
  ["浇", "水"],
  ["我", "就"],
  ["心", "照"],
  ["盼", "望"],
];
const bandItems = bands.flatMap((chars, row) =>
  chars.map((text, col) => box(text, 20 + col * 50, 100 + row * 72, 40, 40)),
);
const bandGot = linesFromBoxes(bandItems);
const bandExpect = bands.map((chars) => chars.join("")).join("\n");
if (bandGot !== bandExpect) {
  console.log("FAIL chain\n", JSON.stringify(bandGot), "\nwant\n", JSON.stringify(bandExpect));
  process.exit(1);
}

const left = ["的", "信", "心"].map((text, i) => box(text, 10 + i * 46, 130, 40, 44));
const right = ["今", "天", "上", "中", "文"].map((text, i) => box(text, 220 + i * 46, 108, 40, 44));
const lower = ["讓", "志", "文"].map((text, i) => box(text, 10 + i * 46, 260, 40, 44));
const splitGot = linesFromBoxes([...left, ...right, ...lower]);
if (splitGot !== "的信心今天上中文\n讓志文") {
  console.log("FAIL side by side", JSON.stringify(splitGot));
  process.exit(1);
}

const headL = ["固", "定", "幼", "苗", "後"].map((text, i) => box(text, 10 + i * 46, 150, 40, 44));
const headR = ["便", "給", "它"].map((text, i) => box(text, 280 + i * 46, 100, 40, 44));
const headNext = ["澆", "水"].map((text, i) => box(text, 10 + i * 46, 230, 40, 44));
const headGot = linesFromBoxes([...headL, ...headR, ...headNext]);
if (headGot !== "固定幼苗後便給它\n澆水") {
  console.log("FAIL tilted halves", JSON.stringify(headGot));
  process.exit(1);
}

const head = box("固定幼苗後", 10, 150, 210, 44);
const tail = box("便給它", 240, 100, 130, 44);
const follow = box("澆水。媽媽說從今", 10, 240, 300, 44);
const si = box("巳", 330, 214, 36, 44);
const headGot2 = linesFromBoxes([head, tail, follow, si]);
if (headGot2 !== "固定幼苗後便給它\n澆水。媽媽說從今巳") {
  console.log("FAIL wide halves", JSON.stringify(headGot2));
  process.exit(1);
}

const stray = [box("澆", 8, 100, 40, 44)];
const main = ["盼", "望", "幼", "苗"].map((text, i) => box(text, 70 + i * 46, 164, 40, 44));
const strayGot = linesFromBoxes([...stray, ...main]);
if (strayGot !== "澆\n盼望幼苗") {
  console.log("FAIL stray left", JSON.stringify(strayGot));
  process.exit(1);
}

const skew = -0.22;
const skewBoxes = [
  box("媽媽說", 10, 220 - 44, 140, 44),
  box("從今", 170, 220 + skew * 170 - 44, 80, 44),
  box("巳", 270, 220 + skew * 270 - 44, 40, 44),
  box("就是幼苗", 10, 340 - 44, 180, 44),
];
const skewGot = linesFromBoxes(skewBoxes);
if (skewGot !== "媽媽說從今巳\n就是幼苗") {
  console.log("FAIL deskew tail", JSON.stringify(skewGot));
  process.exit(1);
}

const tilt = -0.16;
function tiltedBox(text, x, base, w = 40) {
  return box(text, x, base + tilt * x - 44, w, 44);
}
const shifted = [
  tiltedBox("固定幼苗後便給它", 16, 120, 260),
  tiltedBox("澆水。媽媽說從今", 16, 200, 230),
  tiltedBox("巳", 270, 200, 36),
  tiltedBox("就是幼苗的媽媽", 16, 280, 210),
  tiltedBox("用", 260, 280, 36),
  tiltedBox("澆", 16, 360, 40),
  tiltedBox("讓它陽", 180, 360, 120),
  tiltedBox("盼", 16, 440, 40),
  tiltedBox("望幼苗能夠成長越高", 70, 440, 200),
  tiltedBox("有一天翠綠的葉", 70, 520, 180),
  tiltedBox("旁", 270, 520, 36),
];
const shiftedGot = linesFromBoxes(shifted);
const shiftedExpect = [
  "固定幼苗後便給它",
  "澆水。媽媽說從今巳",
  "就是幼苗的媽媽用",
  "澆讓它陽",
  "盼望幼苗能夠成長越高",
  "有一天翠綠的葉旁",
].join("\n");
if (shiftedGot !== shiftedExpect) {
  console.log("FAIL shifted page\n", shiftedGot, "\nwant\n", shiftedExpect);
  process.exit(1);
}

const dropped = [
  box("讓它陽", 80, 300, 120, 44),
  box("澆", 16, 346, 40, 44),
  box("望幼苗能夠成長越高", 80, 380, 220, 44),
  box("旁", 300, 434, 36, 44),
  box("盼", 16, 444, 40, 44),
  box("有一天翠綠的葉", 80, 460, 200, 44),
];
const droppedGot = linesFromBoxes(dropped);
if (droppedGot !== "澆讓它陽\n盼望幼苗能夠成長越高\n有一天翠綠的葉旁") {
  console.log("FAIL dropped left\n", droppedGot);
  process.exit(1);
}

const marginGot = linesFromBoxes([
  box("的信心，今天上中文課時", 220, 80, 400, 44),
  box("讓志文向同學講故事", 220, 160, 380, 44),
  box("志文站起來，感到臉", 220, 240, 360, 44),
  box("王哪裡發", 0, 158, 90, 44),
]);
if (marginGot !== "的信心，今天上中文課時\n讓志文向同學講故事\n志文站起來，感到臉") {
  console.log("FAIL left margin\n", JSON.stringify(marginGot));
  process.exit(1);
}

function zhuyinLine(chars, y) {
  return chars.flatMap((text, i) => {
    const x = 20 + i * 78;
    return [
      box(text, x, y, 46, 50),
      box("公", x + 48, y + 2, 14, 14),
      box("ㄨ", x + 48, y + 18, 14, 14),
    ];
  });
}
const zhuyinGot = linesFromBoxes([
  ...zhuyinLine(["保", "羅", "和", "皮"], 80),
  ...zhuyinLine(["要", "好", "的", "朋"], 170),
  ...zhuyinLine(["爬", "樹", "時", "，"], 260),
]);
if (zhuyinGot !== "保羅和皮\n要好的朋\n爬樹時，") {
  console.log("FAIL zhuyin right\n", JSON.stringify(zhuyinGot));
  process.exit(1);
}

const tilted = ["固", "定", "幼", "苗", "後", "便", "給", "它"].map((text, i) =>
  box(text, 10 + i * 46, 80 + i * 4, 40, 42),
);
const tiltedGot = linesFromBoxes(tilted);
if (tiltedGot !== "固定幼苗後便給它") {
  console.log("FAIL tilt", JSON.stringify(tiltedGot));
  process.exit(1);
}

console.log("ALL PASS");
