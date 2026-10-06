"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { siteName, siteNameEn, siteUrl, siteYear } from "@/lib/site";
import type { ExampleCategory } from "@/lib/types";

export type Locale = "zh" | "en";

const storageKey = "learnlanguage-locale";

const family = {
  zh: [
    { href: "https://learnlanguage.net", label: "主站" },
    { href: "https://fva.learnlanguage.net", label: "法语动词助手" },
    { href: "https://fra.learnlanguage.net", label: "法语阅读助手" },
    { href: siteUrl, label: "粤语助手" },
  ],
  en: [
    { href: "https://learnlanguage.net", label: "Main site" },
    { href: "https://fva.learnlanguage.net", label: "French Verb Assistant" },
    { href: "https://fra.learnlanguage.net", label: "French Reading Assistant" },
    { href: siteUrl, label: "Cantonese Assistant" },
  ],
} as const;

const copy = {
  zh: {
    brand: siteName,
    enName: siteNameEn,
    convert: "转换",
    phrases: "日常短句",
    about: "关于",
    navLabel: "本站",
    langLabel: "语言",
    pagesLabel: "页面",
    copyright: `© ${siteYear} LearnLanguage`,
    input: "输入",
    inputHint: "直接输入，或拍照、上传图片后识别整张或拖选一块。简体、繁体都可以；识别结果按原样进输入框，课本拼音行和台版右侧注音会尽量去掉。图片留在这台设备上。",
    inputPlaceholder: "简体或繁体都可以，例如：今天天气怎么样？",
    cantonese: "粤语口语化表达",
    cantoneseHint: "这是口头说法。点字听粤语。多音字点下面的粤拼可以改读音。",
    glyphs: "字形",
    glyphsHint: "香港繁体、台湾繁体、简体并排。同一位置用字不同的字会标出来。有异体的字，点字下面的另一个字形可以改。粤拼、注音和拼音都在异体下面。",
    hongKong: "香港繁体",
    hongKongHint: "只改香港用字，口头说法留在上面。有异体时，另一个字形在字下面，例如簽字的簽也可以改成籤，牀也可以改成床。粤拼在异体下面，按这行书面字来读，不是上面的口语音。点字听粤语，多音字点粤拼可以改读音。整句用粤语读这一行书面语。后面会变成後面。可以打印成带笔顺的工作纸。",
    taiwan: "台湾繁体",
    taiwanHint: "只改台湾用字。里写成裡，台写成臺。点字听国语，多音字点注音可以改读音。",
    simplified: "简体",
    simplifiedHint: "点字听普通话。多音字点下面的拼音可以改读音。",
    english: "英文",
    englishHint: "按简体意思做机器翻译。句子会送到在线翻译服务。",
    translating: "翻译中…",
    playCantonese: "粤语习惯",
    playWritten: "粤语读书面语",
    playTaiwan: "国语习惯",
    playMandarin: "普通话习惯",
    variantPick: "可改异体",
    playEnglish: "英文朗读",
    playPhrase: "粤语",
    upload: "上传",
    uploadAria: "从相册或文件上传图片",
    camera: "拍照",
    cameraAria: "打开相机拍照",
    cameraShoot: "拍摄",
    cameraClose: "关闭相机",
    cameraNeed: "打不开相机。请允许使用摄像头，或改用上传。",
    recognizeAll: "识别整张",
    recognizeCrop: "识别选区",
    hideImage: "隐藏图片",
    expandImage: "展开图片",
    needImage: "请先选择一张图片。",
    needCrop: "先在图片上拖出一个区域。",
    badImage: "这张图片读不出来。请换成 JPG 或 PNG 再试。",
    ocrOpening: "正在打开图片…",
    ocrHint: "拖出选区。按住框内可以挪位置，拖边角可以改大小。双击图片识别整张，双击选区识别选区。",
    ocrBusy: "正在识别…",
    ocrPreparing: "正在准备识别引擎…",
    ocrLoadingLang: "正在从本站加载识别模型…",
    ocrInit: "正在初始化识别…",
    ocrReading: "正在识别文字…",
    ocrDone: "识别完成，已填入上方文字。图片只留在这台浏览器里。",
    ocrEmpty: "没有识别到文字。可以框选文字更集中的区域再试。",
    ocrFail: "识别失败。请再试一次。",
    printSheet: "打印工作纸",
    sheetModeStrokes: "笔顺临写",
    sheetModeCopy: "长文本抄写",
    sheetCopyHint: "上一行是范字，下一行是田字格。虚线会一起打印出来。",
    sheetTitleCopy: "香港繁体抄写工作纸",
    phrasesTitle: "日常粤语短句",
    phrasesHint: (count: number) => `按场景看短句。点字可以听粤语，共 ${count} 句。`,
    search: "搜索",
    searchPlaceholder: "粤语或简体意思",
    scenes: "场景",
    all: "全部",
    none: "没有找到这样的短句。",
    found: (total: number, from: number, to: number) => `找到 ${total} 句，本页 ${from}–${to}`,
    prev: "上一页",
    next: "下一页",
    other: "其他",
    aboutTitle: `关于${siteName}`,
    aboutLead: `${siteName}（${siteNameEn}）是一个个人、非商业的粤语学习工具。输入一句中文，就能看到粤语口语、三种字形、读音和英文，也可以从图片识字，或把香港繁体做成笔顺工作纸。`,
    aboutWritten: "粤语口语化表达",
    aboutWrittenBody:
      "简体、繁体或两者夹杂都可以直接输入。句子会换成粤语口头说法，每个字下面标粤拼。点一个字可以听这个字的粤语；多音字点下面的粤拼，可以换成另一个读音。整句按粤语口语朗读。",
    aboutGlyphs: "三种字形对照",
    aboutGlyphsBody:
      "同一句话并排显示香港繁体、台湾繁体和简体。同一位置用字不同的字会标出来。简繁一对多的异体在字下面，可以改，例如簽字的簽和籤、牀和床。香港繁体的粤拼在异体下面，读的是这些书面字的音，不是上面的口头说法；多音字可以改读音。香港字形只改用字，口头说法留在上面。香港繁体整句用粤语读这一行书面语。台湾繁体标注音，简体标拼音，多音字同样可以改读音。整句可以分别按国语习惯和普通话习惯朗读。",
    aboutEnglish: "英文",
    aboutEnglishBody: "简体句子会译成英文，并可以按英语朗读。朗读和英文翻译都会把这句话送到在线服务。",
    aboutOcr: "从图片识字",
    aboutOcrBody:
      "可以拍照或从相册选一张图片，识别整张，或在图片上拖出一块再识别。选区可以挪动、改大小。认出的字会按原样填进输入框：简体保持简体，繁体保持繁体，混用也按识别结果。课本里上面一行拼音、下面一行汉字时，会尽量去掉拼音行；台版字右侧的注音也会去掉。同一行里的英文会保留。图片留在这台设备上，识别完成后可以收起，只留一条预览。",
    aboutStrokes: "笔顺工作纸",
    aboutStrokesBody:
      "香港繁体可以打开工作纸。笔顺临写按笔画展开，下面留田字格；长文本抄写是上面一行范字、下面一行田字格。可以勾选要打印的字，并在小方格和大方格之间切换，然后打印或另存为 PDF。",
    aboutPhrases: "日常粤语短句",
    aboutPhrasesBody:
      "短句按场景整理，包括招呼、天气、问路、食物、菜市场、购物、交通、学校、体育运动、亲属关系、打电话等。可以按场景筛选或搜索，点字听粤语。",
    aboutSources: "所用资料",
    aboutOpenCC: "负责香港和台湾字形，并提供简繁一对多的异体候选。",
    aboutJyutping: "（CanCLID，BSD-2-Clause）负责粤拼。",
    aboutPinyin: "（zh-lx，MIT）负责拼音，注音由拼音转写。",
    aboutHanzi: "提供笔顺笔画，供临写参考。",
    categories: {
      greeting: "招呼",
      weather: "天气",
      directions: "问路",
      food: "食物",
      market: "菜市场",
      shopping: "购物",
      transport: "交通",
      time: "时间",
      home: "在家",
      animal: "动物",
      plant: "植物",
      family: "家人",
      kinship: "亲属关系",
      work: "工作",
      study: "学习",
      school: "学校",
      sport: "体育运动",
      health: "身体",
      feeling: "心情",
      contact: "联络",
      phone: "打电话",
      plans: "约见面",
      courtesy: "客气",
      help: "急事",
    } satisfies Record<ExampleCategory, string>,
  },
  en: {
    brand: siteNameEn,
    enName: siteNameEn,
    convert: "Convert",
    phrases: "Phrases",
    about: "About",
    navLabel: "This site",
    langLabel: "Language",
    pagesLabel: "Pages",
    copyright: `© ${siteYear} LearnLanguage`,
    input: "Input",
    inputHint: "Type, or take or upload a photo and recognize the whole image or a selection. Simplified or traditional Chinese both work; OCR keeps the recognized script and tries to drop textbook pinyin rows and Taiwan zhuyin. Photos stay on this device.",
    inputPlaceholder: "Simplified or traditional Chinese, for example: 今天天气怎么样？",
    cantonese: "Colloquial Cantonese",
    cantoneseHint: "This is the spoken wording. Tap a character to hear Cantonese. Tap Jyutping under a character to change a reading.",
    glyphs: "Scripts",
    glyphsHint: "Hong Kong traditional, Taiwan traditional, and simplified side by side. Characters that differ in the same place are marked. If a character has variants, tap the other glyph under it to switch. Jyutping, zhuyin, and pinyin sit below the variant.",
    hongKong: "Hong Kong traditional",
    hongKongHint: "Only the Hong Kong glyphs change. The spoken wording stays above. When a character has variants, the other glyph sits under the character, for example 簽 or 籤 in 簽字, and 牀 or 床. Jyutping sits below that glyph and is the reading of this written line, not the colloquial wording above. Tap a character to hear Cantonese, and tap Jyutping to change a reading. The whole line is read aloud in Cantonese as written Chinese. 后面 becomes 後面. You can print a stroke worksheet.",
    taiwan: "Taiwan traditional",
    taiwanHint: "Only the Taiwan glyphs change. 里 becomes 裡, 台 becomes 臺. Tap a character to hear Mandarin; tap zhuyin to change a reading.",
    simplified: "Simplified",
    simplifiedHint: "Tap a character to hear Mandarin. Tap pinyin under a character to change a reading.",
    english: "English",
    englishHint: "A machine translation of the simplified sentence. The sentence is sent to an online translation service.",
    translating: "Translating…",
    playCantonese: "Cantonese reading",
    playWritten: "Cantonese reading of the written sentence",
    playTaiwan: "Taiwan Mandarin",
    playMandarin: "Mainland Mandarin",
    variantPick: "Choose a variant",
    playEnglish: "English reading",
    playPhrase: "Cantonese",
    upload: "Upload",
    uploadAria: "Upload an image from photos or files",
    camera: "Photo",
    cameraAria: "Open the camera",
    cameraShoot: "Take photo",
    cameraClose: "Close camera",
    cameraNeed: "The camera could not be opened. Allow camera access, or upload a file instead.",
    recognizeAll: "Recognize all",
    recognizeCrop: "Recognize selection",
    hideImage: "Hide image",
    expandImage: "Show image",
    needImage: "Choose an image first.",
    needCrop: "Drag a region on the image first.",
    badImage: "This image could not be read. Try a JPG or PNG.",
    ocrOpening: "Opening the image…",
    ocrHint: "Drag a region. Drag inside the box to move it, or drag a corner to resize. Double-click the picture to recognize all of it, or double-click the box to recognize the selection.",
    ocrBusy: "Recognizing…",
    ocrPreparing: "Preparing the recognizer…",
    ocrLoadingLang: "Loading the recognizer from this site…",
    ocrInit: "Starting recognition…",
    ocrReading: "Reading the text…",
    ocrDone: "Recognition finished. The text was filled in above. The image stays in this browser.",
    ocrEmpty: "No text was found. Try selecting a tighter region of text.",
    ocrFail: "Recognition failed. Try again.",
    printSheet: "Print worksheet",
    sheetModeStrokes: "Stroke practice",
    sheetModeCopy: "Copying practice",
    sheetCopyHint: "A model character on the top row, and a Tianzige box underneath. The dashed guides print with the page.",
    sheetTitleCopy: "Hong Kong traditional copying worksheet",
    phrasesTitle: "Everyday Cantonese",
    phrasesHint: (count: number) => `Browse by scene. Tap a character to hear Cantonese. ${count} sentences.`,
    search: "Search",
    searchPlaceholder: "Cantonese or simplified meaning",
    scenes: "Scenes",
    all: "All",
    none: "No sentences like that.",
    found: (total: number, from: number, to: number) => `${total} sentences, this page ${from}–${to}`,
    prev: "Previous",
    next: "Next",
    other: "Other",
    aboutTitle: `About ${siteNameEn}`,
    aboutLead: `${siteName} (${siteNameEn}) is a personal, noncommercial Cantonese learning tool. Type a Chinese sentence to see colloquial Cantonese, three scripts, readings, and English, or recognize text from a photo, or make a Hong Kong traditional stroke worksheet.`,
    aboutWritten: "Colloquial Cantonese",
    aboutWrittenBody:
      "Simplified, traditional, or mixed input all work. The sentence becomes colloquial Cantonese with Jyutping under each character. Tap a character to hear it; tap Jyutping to change a reading. The whole sentence is read as spoken Cantonese.",
    aboutGlyphs: "Three scripts",
    aboutGlyphsBody:
      "The same sentence is shown in Hong Kong traditional, Taiwan traditional, and simplified. Characters that differ in the same place are marked. One-to-many traditional variants sit under the character and can be switched, for example 簽 and 籤 in 簽字, or 牀 and 床. Jyutping on the Hong Kong line sits below the variant. It is the reading of those written characters, not the colloquial wording above, and a reading can be changed. Hong Kong glyphs only change the writing; the spoken wording stays above. The Hong Kong line is read aloud in Cantonese as written Chinese. Taiwan traditional has zhuyin, simplified has pinyin, and readings can be changed. The sentence can be read in Taiwan Mandarin or mainland Mandarin.",
    aboutEnglish: "English",
    aboutEnglishBody: "The simplified sentence is translated into English and can be read aloud. Speech and translation send the sentence to online services.",
    aboutOcr: "Text from photos",
    aboutOcrBody:
      "Take a photo or choose one from the library, recognize the whole image, or drag a region. The region can be moved and resized. Recognized text fills the input as-is: simplified stays simplified, traditional stays traditional, and mixed text keeps both. Pinyin rows above characters are filtered when possible, and Taiwan zhuyin beside a character is removed. English on the same line is kept. Photos stay on this device and can be collapsed after recognition.",
    aboutStrokes: "Stroke worksheets",
    aboutStrokesBody:
      "Hong Kong traditional can open a worksheet. Stroke practice shows each character stroke by stroke with Tianzige boxes below. Copying practice puts a model character on the top row and a Tianzige box on the row beneath. You can choose which characters to print, switch between small and large boxes, then print or save as PDF.",
    aboutPhrases: "Everyday Cantonese",
    aboutPhrasesBody:
      "Sentences are grouped by scene, including greetings, weather, directions, food, wet markets, shopping, transport, school, sports, kinship, and phone calls. Filter by scene or search, and tap a character to hear Cantonese.",
    aboutSources: "Sources",
    aboutOpenCC: "handles Hong Kong and Taiwan glyphs, and one-to-many traditional variant choices.",
    aboutJyutping: " (CanCLID, BSD-2-Clause) handles Jyutping.",
    aboutPinyin: " (zh-lx, MIT) handles pinyin. Zhuyin is derived from pinyin.",
    aboutHanzi: "provides stroke paths for practice.",
    categories: {
      greeting: "Greetings",
      weather: "Weather",
      directions: "Directions",
      food: "Food",
      market: "Market",
      shopping: "Shopping",
      transport: "Transport",
      time: "Time",
      home: "At home",
      animal: "Animals",
      plant: "Plants",
      family: "Family",
      kinship: "Kinship",
      work: "Work",
      study: "Study",
      school: "School",
      sport: "Sports",
      health: "Body",
      feeling: "Feelings",
      contact: "Contact",
      phone: "Phone",
      plans: "Meeting up",
      courtesy: "Courtesy",
      help: "Help",
    } satisfies Record<ExampleCategory, string>,
  },
} as const;

type Copy = (typeof copy)[Locale];

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Copy;
  familyNav: (typeof family)[Locale];
} | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "en" || saved === "zh") setLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-HK" : "en";
    window.localStorage.setItem(storageKey, locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: copy[locale],
      familyNav: family[locale],
    }),
    [locale],
  );

  return createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale needs LocaleProvider.");
  return value;
}
