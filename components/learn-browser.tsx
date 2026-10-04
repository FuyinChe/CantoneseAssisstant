"use client";

import { useMemo, useState } from "react";
import { JyutpingLine } from "@/components/jyutping-line";
import { PlayButton } from "@/components/play-button";
import { bundledExamples, categoryLabel, EXAMPLE_CATEGORIES } from "@/lib/examples";
import type { ExampleCategory } from "@/lib/types";

const PAGE_SIZE = 20;

export function LearnBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExampleCategory | "all">("all");
  const [page, setPage] = useState(0);
  const examples = useMemo(() => bundledExamples(), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return examples.filter((example) => {
      if (category !== "all" && example.category !== category) return false;
      if (!needle) return true;
      return [example.cantonese, example.simplified, example.traditional, example.jyutping, example.mandarinGloss, categoryLabel(example.category)]
        .join("\n")
        .toLowerCase()
        .includes(needle);
    });
  }, [category, examples, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const groups = useMemo(() => {
    const next: { id: string; label: string; examples: typeof visible }[] = [];
    for (const example of visible) {
      const label = categoryLabel(example.category);
      const last = next.at(-1);
      if (last?.label === label) last.examples.push(example);
      else next.push({ id: `${example.category ?? "other"}-${example.id}`, label, examples: [example] });
    }
    return next;
  }, [visible]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">日常粤语短句</h1>
        <p className="text-sm text-muted">按场景看短句。点字可以听粤语，共 {examples.length} 句。</p>
        <label className="text-sm" htmlFor="example-search">
          搜索
          <input
            id="example-search"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="粤语或简体意思"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="场景">
          <button
            type="button"
            className={chipClass(category === "all")}
            aria-pressed={category === "all"}
            onClick={() => {
              setCategory("all");
              setPage(0);
            }}
          >
            全部
          </button>
          {EXAMPLE_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={chipClass(category === item.id)}
              aria-pressed={category === item.id}
              onClick={() => {
                setCategory(item.id);
                setPage(0);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {groups.length === 0 ? <p className="text-sm text-muted">没有找到这样的短句。</p> : null}

      {filtered.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            找到 {filtered.length} 句，本页 {pageStart + 1}–{pageStart + visible.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-line bg-card px-3 py-1 disabled:opacity-40"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              上一页
            </button>
            <span className="self-center">
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="rounded-full border border-line bg-card px-3 py-1 disabled:opacity-40"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      ) : null}

      {groups.map((group) => (
        <section key={group.id} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{group.label}</h2>
          <ul className="flex flex-col gap-3">
            {group.examples.map((example) => (
              <li key={example.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <JyutpingLine key={example.cantonese} text={example.cantonese} />
                    <p className="mt-2 text-sm">{example.mandarinGloss}</p>
                  </div>
                  <PlayButton text={example.cantonese} lang="zh-HK" label="粤语" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function chipClass(selected: boolean) {
  return selected
    ? "rounded-full bg-accent px-3 py-1 text-sm text-white"
    : "rounded-full border border-line bg-card px-3 py-1 text-sm";
}
