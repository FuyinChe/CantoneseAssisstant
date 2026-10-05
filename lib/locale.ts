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
    inputHint: "直接输入，或拍照、上传图片后识别整张或拖选一块。简体、繁体都可以。图片留在这台设备上。",
    inputPlaceholder: "简体或繁体都可以，例如：我不知道后面怎么走。",
    cantonese: "粤语表达",
    cantoneseHint: "点字听粤语。多音字点下面的粤拼可以改读音。",
    glyphs: "字形",
    glyphsHint: "香港繁体、台湾繁体、简体并排。同一位置用字不同的字会标出来。",
    hongKong: "香港繁体",
    hongKongHint: "只改香港用字，口头说法不变。后面会变成後面。可以打印成带笔顺的工作纸。",
    taiwan: "台湾繁体",
    taiwanHint: "只改台湾用字。里写成裡，台写成臺。点字听国语，多音字点注音可以改读音。",
    simplified: "简体",
    simplifiedHint: "点字听普通话。多音字点下面的拼音可以改读音。",
    english: "英文",
    englishHint: "按简体意思做机器翻译。句子会送到在线翻译服务。",
    translating: "翻译中…",
    playCantonese: "粤语习惯",
    playTaiwan: "国语习惯",
    playMandarin: "普通话习惯",
    playEnglish: "英文朗读",
    playPhrase: "粤语",
    upload: "拍照或上传",
    uploadAria: "拍照或上传图片",
    recognizeAll: "识别整张",
    recognizeCrop: "识别选区",
    hideImage: "隐藏图片",
    expandImage: "展开图片",
    needImage: "请先选择一张图片。",
    needCrop: "先在图片上拖出一个区域。",
    badImage: "这张图片读不出来。请换成 JPG 或 PNG 再试。",
    printSheet: "打印工作纸",
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
    aboutLead: `${siteName}（${siteNameEn}）是一个个人、非商业的粤语学习工具。输入一句中文，就能看到粤语说法、三种字形、读音和英文，也可以从图片识字，或把香港繁体做成笔顺工作纸。`,
    aboutWritten: "粤语书面说法",
    aboutWrittenBody:
      "简体、繁体或两者夹杂都可以直接输入。句子会换成粤语书面说法，每个字下面标粤拼。点一个字可以听这个字的粤语；多音字点下面的粤拼，可以换成另一个读音。整句也可以按粤语习惯朗读。",
    aboutGlyphs: "三种字形对照",
    aboutGlyphsBody:
      "同一句话并排显示香港繁体、台湾繁体和简体。同一位置用字不同的字会标出来。香港字形只改用字，口头说法留在粤语那一栏。台湾繁体标注音，简体标拼音，多音字同样可以改读音。整句可以分别按国语习惯和普通话习惯朗读。",
    aboutEnglish: "英文",
    aboutEnglishBody: "简体句子会译成英文，并可以按英语朗读。朗读和英文翻译都会把这句话送到在线服务。",
    aboutOcr: "从图片识字",
    aboutOcrBody:
      "可以拍照或从相册选一张图片，识别整张，或在图片上拖出一块再识别。认出的字会填进输入框，接着走同一套粤语转换。图片留在这台设备上，识别完成后可以收起，只留一条预览。",
    aboutStrokes: "笔顺工作纸",
    aboutStrokesBody:
      "香港繁体可以打开笔顺工作纸。每个字按笔画展开，下面留田字格临写。可以勾选要打印的字，并在大方格和小方格之间切换，然后打印或另存为 PDF。",
    aboutPhrases: "日常粤语短句",
    aboutPhrasesBody:
      "短句按场景整理，包括招呼、天气、问路、食物、菜市场、购物、交通、学校、体育运动、亲属关系、打电话等。可以按场景筛选或搜索，点字听粤语。",
    aboutSources: "所用资料",
    aboutOpenCC: "负责香港和台湾字形。",
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
    inputHint: "Type, or take or upload a photo and recognize the whole image or a selection. Simplified or traditional Chinese both work. Photos stay on this device.",
    inputPlaceholder: "Simplified or traditional Chinese, for example: 我不知道后面怎么走。",
    cantonese: "Cantonese",
    cantoneseHint: "Tap a character to hear Cantonese. Tap Jyutping under a character to change a reading.",
    glyphs: "Scripts",
    glyphsHint: "Hong Kong traditional, Taiwan traditional, and simplified side by side. Characters that differ in the same place are marked.",
    hongKong: "Hong Kong traditional",
    hongKongHint: "Only the Hong Kong glyphs change. The spoken form stays in the Cantonese section. 后面 becomes 後面. You can print a stroke worksheet.",
    taiwan: "Taiwan traditional",
    taiwanHint: "Only the Taiwan glyphs change. 里 becomes 裡, 台 becomes 臺. Tap a character to hear Mandarin; tap zhuyin to change a reading.",
    simplified: "Simplified",
    simplifiedHint: "Tap a character to hear Mandarin. Tap pinyin under a character to change a reading.",
    english: "English",
    englishHint: "A machine translation of the simplified sentence. The sentence is sent to an online translation service.",
    translating: "Translating…",
    playCantonese: "Cantonese reading",
    playTaiwan: "Taiwan Mandarin",
    playMandarin: "Mainland Mandarin",
    playEnglish: "English reading",
    playPhrase: "Cantonese",
    upload: "Photo or upload",
    uploadAria: "Take or upload a photo",
    recognizeAll: "Recognize all",
    recognizeCrop: "Recognize selection",
    hideImage: "Hide image",
    expandImage: "Show image",
    needImage: "Choose an image first.",
    needCrop: "Drag a region on the image first.",
    badImage: "This image could not be read. Try a JPG or PNG.",
    printSheet: "Print worksheet",
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
    aboutLead: `${siteName} (${siteNameEn}) is a personal, noncommercial Cantonese learning tool. Type a Chinese sentence to see the Cantonese wording, three scripts, readings, and English, or recognize text from a photo, or make a Hong Kong traditional stroke worksheet.`,
    aboutWritten: "Written Cantonese",
    aboutWrittenBody:
      "Simplified, traditional, or mixed input all work. The sentence becomes written Cantonese with Jyutping under each character. Tap a character to hear it; tap Jyutping to change a reading. The whole sentence can be read in Cantonese.",
    aboutGlyphs: "Three scripts",
    aboutGlyphsBody:
      "The same sentence is shown in Hong Kong traditional, Taiwan traditional, and simplified. Characters that differ in the same place are marked. Hong Kong glyphs only change the writing; the spoken form stays in the Cantonese section. Taiwan traditional has zhuyin, simplified has pinyin, and readings can be changed. The sentence can be read in Taiwan Mandarin or mainland Mandarin.",
    aboutEnglish: "English",
    aboutEnglishBody: "The simplified sentence is translated into English and can be read aloud. Speech and translation send the sentence to online services.",
    aboutOcr: "Text from photos",
    aboutOcrBody:
      "Take a photo or choose one from the library, recognize the whole image, or drag a region. Recognized text fills the input box and goes through the same Cantonese conversion. Photos stay on this device and can be collapsed after recognition.",
    aboutStrokes: "Stroke worksheets",
    aboutStrokesBody:
      "Hong Kong traditional can open a stroke worksheet. Each character is shown stroke by stroke, with practice boxes below. You can choose which characters to print, switch between large and small boxes, then print or save as PDF.",
    aboutPhrases: "Everyday Cantonese",
    aboutPhrasesBody:
      "Sentences are grouped by scene, including greetings, weather, directions, food, wet markets, shopping, transport, school, sports, kinship, and phone calls. Filter by scene or search, and tap a character to hear Cantonese.",
    aboutSources: "Sources",
    aboutOpenCC: "handles Hong Kong and Taiwan glyphs.",
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
