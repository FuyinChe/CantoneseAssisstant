import { zhuyinClearRanges } from "../lib/ocr-zhuyin.ts";

function cell(charW, rubyW, gapIn, gapOut, ink = 40) {
  const values = [];
  for (let i = 0; i < charW; i++) values.push(ink);
  for (let i = 0; i < gapIn; i++) values.push(0);
  for (let i = 0; i < rubyW; i++) values.push(28);
  for (let i = 0; i < gapOut; i++) values.push(0);
  return values;
}

const height = 160;
const ink = [0, 0, ...cell(66, 23, 12, 40), ...cell(70, 24, 20, 41), ...cell(65, 22, 22, 52), ...cell(73, 17, 20, 42)];
const cleared = zhuyinClearRanges(ink, height);
if (cleared.length < 4) {
  console.log("FAIL zhuyin ranges", cleared);
  process.exit(1);
}

const plain = [];
for (let n = 0; n < 6; n++) {
  for (let i = 0; i < 60; i++) plain.push(40);
  for (let i = 0; i < 36; i++) plain.push(0);
}
const plainCleared = zhuyinClearRanges(plain, height);
if (plainCleared.length !== 0) {
  console.log("FAIL plain line", plainCleared);
  process.exit(1);
}

// Ruby runs outnumber the characters, as on a short picture-book line.
const crowded = [];
for (const [charW, rubyW, gapIn, gapOut] of [
  [74, 26, 17, 40],
  [84, 24, 15, 38],
  [74, 26, 16, 42],
  [78, 24, 14, 36],
]) {
  for (let i = 0; i < charW; i++) crowded.push(40);
  for (let i = 0; i < gapIn; i++) crowded.push(0);
  for (let i = 0; i < rubyW; i++) crowded.push(28);
  for (let i = 0; i < gapOut; i++) crowded.push(0);
}
for (let n = 0; n < 6; n++) {
  for (let i = 0; i < 22; i++) crowded.push(20);
  for (let i = 0; i < 12; i++) crowded.push(0);
}
const crowdedCleared = zhuyinClearRanges(crowded, 80);
if (crowdedCleared.length < 4) {
  console.log("FAIL crowded ruby", crowdedCleared);
  process.exit(1);
}

console.log("ALL PASS");
