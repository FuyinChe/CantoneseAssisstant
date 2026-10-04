export interface Rewriter {
  rewrite(traditionalMandarin: string): Promise<string>;
}
