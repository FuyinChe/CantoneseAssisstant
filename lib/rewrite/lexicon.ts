import { createMatcher } from "../lexicon";
import type { PhraseEntry } from "../types";
import type { Rewriter } from "./types";

export class LexiconRewriter implements Rewriter {
  private readonly matcher: ReturnType<typeof createMatcher>;

  constructor(entries: PhraseEntry[]) {
    this.matcher = createMatcher(entries);
  }

  async rewrite(traditionalMandarin: string) {
    return this.matcher.apply(traditionalMandarin);
  }
}
