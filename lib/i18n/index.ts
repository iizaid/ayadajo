import ar from "@/locales/ar.json";

type LocaleMessages = typeof ar;
type DotPrefix<TPrefix extends string, TKey extends string> = `${TPrefix}.${TKey}`;

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? DotPrefix<K, DotPaths<T[K]>>
    : K;
}[keyof T & string];

export type MessageKey = DotPaths<LocaleMessages>;

export function t(key: MessageKey): string {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, ar);

  if (typeof value !== "string") {
    throw new Error(`Missing i18n message: ${key}`);
  }

  return value;
}
