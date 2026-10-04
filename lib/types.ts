export type SourceType =
  | "dictionary"
  | "film"
  | "book"
  | "news"
  | "blog"
  | "social"
  | "user";

export type PhraseEntry = {
  from: string;
  to: string;
};

export type Example = {
  id: string;
  traditional: string;
  simplified: string;
  cantonese: string;
  jyutping: string;
  mandarinGloss: string;
  sourceType: SourceType;
  sourceTitle: string;
  sourceUrl?: string;
  license: string;
  note?: string;
};

export type Conversion = {
  simplified: string;
  traditional: string;
  taiwan: string;
  cantonese: string;
};

export const SOURCE_LABELS: Record<SourceType, string> = {
  dictionary: "词典",
  film: "影视",
  book: "图书",
  news: "新闻",
  blog: "博客",
  social: "社交媒体",
  user: "自己整理",
};
