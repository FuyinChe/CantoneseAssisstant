import {
  cleanOcrLine,
  cleanOcrText,
  isLikelyPinyinLine,
} from "../lib/ocr-text.ts";

const cases = [
  ["今天天气怎么样？", "今天天气怎么样？"],
  ["今天 天 气 怎 么 样？", "今天天气怎么样？"],
  ["簽字成功", "簽字成功"],
  ["jīn tiān\n今天天气真好", "今天天气真好"],
  ["jin1 tian1\n今天天气真好", "今天天气真好"],
  ["Hello world\n你好", "Hello world\n你好"],
  ["使用 iPhone 拍照", "使用 iPhone 拍照"],
  ["This is a book\n这是一本书", "This is a book\n这是一本书"],
  ["jīn tiān 今天天气", "今天天气"],
  ["今天天气 jīn tiān", "今天天气"],
  ["床 前 明 月 光", "床前明月光"],
  ["繁體與简体混合測試", "繁體與简体混合測試"],
  ["使 用 iPhone 拍 照", "使用 iPhone 拍照"],
  ["志文站起来 Zhiwen 感到脸", "志文站起来感到脸"],
  ["今天上中文課時 shangzhong", "今天上中文課時"],
  ["使用 OCR 拍照", "使用 OCR 拍照"],
  ["在發熱,心跳得很快。\nio 5 mei\n老師說:「我們都期待", "在發熱,心跳得很快。\n老師說:「我們都期待"],
  [
    "人和 ~只吃\n文課則\n的信心,今天上中文課時\n讓志文向同學講故事",
    "文課則\n的信心,今天上中文課時\n讓志文向同學講故事",
  ],
  [
    "Gu ding you mc nou\n固定幼苗後,我便給它\npor wonc you migo\n盼望幼苗能夠越長越高",
    "固定幼苗後,我便給它\n盼望幼苗能夠越長越高",
  ],
  [
    "固定幼苗後 miaohouW()便給它\n澆水。媽媽說從今1100巳\n就是幼苗的媽媽111用\n照料naolaoWO的小寶寶每\n地愛護我的小寶(1()(1)\n寶地baochéng 讓它健康zhǎngrong11)",
    "固定幼苗後便給它\n澆水。媽媽說從今巳\n就是幼苗的媽媽用\n照料的小寶寶每\n地愛護我的小寶\n寶地讓它健康",
  ],
  ["望幼苗能夠成長越高\n我\n地成長", "望幼苗能夠成長越高\n我\n地成長"],
  ["保羅ㄅㄠˇ和皮克斯", "保羅和皮克斯"],
];

let fail = 0;
for (const [input, expect] of cases) {
  const got = cleanOcrText(input);
  if (got !== expect) {
    fail += 1;
    console.log("FAIL", JSON.stringify(input), "=>", JSON.stringify(got), "want", JSON.stringify(expect));
  }
}
console.log(
  "pinyin",
  isLikelyPinyinLine("jīn tiān qì"),
  isLikelyPinyinLine("Hello world"),
  isLikelyPinyinLine("iPhone 15"),
);
console.log("mixed", cleanOcrLine("使 用 iPhone 拍 照"));
if (fail) {
  console.log(`FAILED ${fail}`);
  process.exit(1);
}
console.log("ALL PASS");
