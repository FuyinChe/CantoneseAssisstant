import bundled from "@/data/examples.json";
import type { Example, ExampleCategory } from "./types";

export const EXAMPLE_CATEGORIES: { id: ExampleCategory; label: string }[] = [
  { id: "greeting", label: "招呼" },
  { id: "weather", label: "天气" },
  { id: "directions", label: "问路" },
  { id: "food", label: "食物" },
  { id: "market", label: "菜市场" },
  { id: "shopping", label: "购物" },
  { id: "transport", label: "交通" },
  { id: "time", label: "时间" },
  { id: "home", label: "在家" },
  { id: "animal", label: "动物" },
  { id: "plant", label: "植物" },
  { id: "family", label: "家人" },
  { id: "kinship", label: "亲属关系" },
  { id: "work", label: "工作" },
  { id: "study", label: "学习" },
  { id: "school", label: "学校" },
  { id: "sport", label: "体育运动" },
  { id: "health", label: "身体" },
  { id: "feeling", label: "心情" },
  { id: "contact", label: "联络" },
  { id: "phone", label: "打电话" },
  { id: "plans", label: "约见面" },
  { id: "courtesy", label: "客气" },
  { id: "help", label: "急事" },
];

const labels = Object.fromEntries(EXAMPLE_CATEGORIES.map((item) => [item.id, item.label])) as Record<
  ExampleCategory,
  string
>;

export function categoryLabel(category: ExampleCategory | undefined) {
  return category ? labels[category] : "其他";
}

export function bundledExamples(): Example[] {
  return bundled.examples as Example[];
}
