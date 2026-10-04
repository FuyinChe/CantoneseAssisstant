import type { Rewriter } from "./types";

/**
 * Reserved rewrite path. This version does not call a model and is not
 * imported by the app.
 */
export class LlmRewriter implements Rewriter {
  async rewrite(traditionalMandarin: string): Promise<string> {
    const configured = Boolean(process.env.AI_GATEWAY_API_KEY);
    throw new Error(
      configured
        ? `大模型改写尚未接入：${traditionalMandarin}`
        : "大模型改写尚未接入。设置 AI_GATEWAY_API_KEY 后才能在以后的版本启用。",
    );
  }
}
