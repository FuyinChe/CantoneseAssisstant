"use client";

import { useLocale } from "@/lib/locale";

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <article className="mx-auto w-[min(880px,calc(100%-32px))] leading-7">
      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutTitle}</h2>
        <p className="max-w-[40rem] text-muted">{t.aboutLead}</p>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutWritten}</h2>
        <p>{t.aboutWrittenBody}</p>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutGlyphs}</h2>
        <p>{t.aboutGlyphsBody}</p>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutEnglish}</h2>
        <p>{t.aboutEnglishBody}</p>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutOcr}</h2>
        <p>{t.aboutOcrBody}</p>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutStrokes}</h2>
        <p>{t.aboutStrokesBody}</p>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutPhrases}</h2>
        <p>{t.aboutPhrasesBody}</p>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="mb-3 font-serif text-[1.35rem] font-medium">{t.aboutSources}</h2>
        <ul className="list-disc pl-5">
          <li>
            <a className="underline" href="https://github.com/BYVoid/OpenCC">OpenCC</a>
            {t.aboutOpenCC}
          </li>
          <li>
            <a className="underline" href="https://github.com/CanCLID/to-jyutping">to-jyutping</a>
            {t.aboutJyutping}
          </li>
          <li>
            <a className="underline" href="https://github.com/zh-lx/pinyin-pro">pinyin-pro</a>
            {t.aboutPinyin}
          </li>
          <li>
            <a className="underline" href="https://github.com/skishore/makemeahanzi">Make Me a Hanzi</a>
            {t.aboutHanzi}
          </li>
        </ul>
      </section>
    </article>
  );
}
