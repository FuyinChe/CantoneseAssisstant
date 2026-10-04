import bundled from "@/data/examples.json";
import type { Example } from "./types";

export const LOCAL_EXAMPLES_KEY = "cantonese-assistant.examples.v1";

export function bundledExamples(): Example[] {
  return bundled.examples as Example[];
}

const localExampleListeners = new Set<() => void>();

export function subscribeLocalExamples(listener: () => void) {
  localExampleListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_EXAMPLES_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    localExampleListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function readLocalExamplesSnapshot() {
  return window.localStorage.getItem(LOCAL_EXAMPLES_KEY) ?? "[]";
}

export function parseLocalExamples(raw: string): Example[] {
  try {
    const parsed = JSON.parse(raw) as Example[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalExamples(examples: Example[]) {
  window.localStorage.setItem(LOCAL_EXAMPLES_KEY, JSON.stringify(examples));
  for (const listener of localExampleListeners) listener();
}
