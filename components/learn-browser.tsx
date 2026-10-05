"use client";

import { useMemo, useState } from "react";
import { JyutpingLine } from "@/components/jyutping-line";
import { PlayButton } from "@/components/play-button";
import { bundledExamples, EXAMPLE_CATEGORIES } from "@/lib/examples";
import { useLocale } from "@/lib/locale";
import type { ExampleCategory } from "@/lib/types";

const PAGE_SIZE = 20;

export function LearnBrowser() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExampleCategory | "all">("all");
  const [page, setPage] = useState(0);
  const examples = useMemo(() => bundledExamples(), []);
  const labelFor = (id: ExampleCategory | undefined) => (id ? t.categories[id] : t.other);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return examples.filter((example) => {
      if (category !== "all" && example.category !== category) return false;
      if (!needle) return true;
      return [example.cantonese, example.simplified, example.traditional, example.jyutping, example.mandarinGloss, labelFor(example.category)]
        .join("\n")
        .toLowerCase()
        .includes(needle);
    });
  }, [category, examples, query, t]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const groups = useMemo(() => {
    const next: { id: string; label: string; examples: typeof visible }[] = [];
    for (const example of visible) {
      const label = labelFor(example.category);
      const last = next.at(-1);
      if (last?.label === label) last.examples.push(example);
      else next.push({ id: `${example.category ?? "other"}-${example.id}`, label, examples: [example] });
    }
    return next;
  }, [visible, t]);

  return (
    <div className="mx-auto w-[min(880px,calc(100%-32px))]">
      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.phrasesTitle}</h2>
        <p className="text-muted">{t.phrasesHint(examples.length)}</p>
        <label className="mt-5 block text-sm" htmlFor="example-search">
          {t.search}
          <input
            id="example-search"
            className="mt-1 w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-foreground"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={t.searchPlaceholder}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t.scenes}>
          <button
            type="button"
            className={chipClass(category === "all")}
            aria-pressed={category === "all"}
            onClick={() => {
              setCategory("all");
              setPage(0);
            }}
          >
            {t.all}
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
              {t.categories[item.id]}
            </button>
          ))}
        </div>
      </section>

      {groups.length === 0 ? <p className="text-sm text-muted">{t.none}</p> : null}

      {filtered.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>{t.found(filtered.length, pageStart + 1, pageStart + visible.length)}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] disabled:opacity-40"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              {t.prev}
            </button>
            <span className="self-center">
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] disabled:opacity-40"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              {t.next}
            </button>
          </div>
        </div>
      ) : null}

      {groups.map((group) => (
        <section key={group.id} className="border-t border-line py-8">
          <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{group.label}</h2>
          <ul className="flex flex-col">
            {group.examples.map((example) => (
              <li key={example.id} className="border-t border-line py-5 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <JyutpingLine key={example.cantonese} text={example.cantonese} />
                    <p className="mt-2 text-sm">{example.mandarinGloss}</p>
                  </div>
                  <PlayButton text={example.cantonese} lang="zh-HK" label={t.playPhrase} />
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
    ? "rounded-full bg-foreground px-4 py-2 text-[0.88rem] text-background"
    : "rounded-full border border-line bg-card px-4 py-2 text-[0.88rem]";
}
