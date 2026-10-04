import type { Conversion, PhraseEntry } from "./types";
import { LexiconRewriter } from "./rewrite/lexicon";

type Converter = (text: string) => string;

let toCn: Converter | null = null;
let toHk: Converter | null = null;
let toTw: Converter | null = null;
let rewriter: LexiconRewriter | null = null;

async function loadRuntime() {
  if (toCn && toHk && toTw && rewriter) return { toCn, toHk, toTw, rewriter };
  const [{ Converter }, phraseMap] = await Promise.all([
    import("opencc-js"),
    import("@/data/phrase-map.json"),
  ]);
  toCn = Converter({ from: "t", to: "cn" });
  toHk = Converter({ from: "cn", to: "hk" });
  toTw = Converter({ from: "cn", to: "tw" });
  const entries: PhraseEntry[] = phraseMap.entries.map((entry) => ({
    from: toHk!(entry.from),
    to: toHk!(entry.to),
  }));
  rewriter = new LexiconRewriter(entries);
  return { toCn, toHk, toTw, rewriter };
}

export async function convertText(input: string): Promise<Conversion> {
  if (!input.trim()) {
    return { simplified: input, traditional: "", taiwan: "", cantonese: "" };
  }
  const runtime = await loadRuntime();
  const simplified = runtime.toCn(input);
  const traditional = runtime.toHk(simplified);
  const taiwan = runtime.toTw(simplified);
  const cantonese = await runtime.rewriter.rewrite(traditional);
  return { simplified, traditional, taiwan, cantonese };
}
