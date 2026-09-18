import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

// Deliberately no `[locale]` URL segment (see the multi-language plan) —
// the whole existing route tree, middleware.ts's scoped matcher, and
// sitemap.ts all stay untouched. Locale lives in a cookie instead, read
// here per request, same as any other per-request preference this app
// reads via next/headers.
export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "pt"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

function isSupportedLocale(value: string | undefined): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// A returning visitor's explicit choice (the cookie, set by the
// LocaleSwitcher) always wins. A first-time visitor gets their browser's
// own language preference, which is only ever a light nudge — nothing
// here should ever silently show a customer a page they can't switch out
// of, so falling back to English for anything unsupported/unparseable is
// always safe.
function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null): AppLocale {
  if (isSupportedLocale(cookieValue)) return cookieValue;
  const preferred = acceptLanguage
    ?.split(",")[0]
    ?.split("-")[0]
    ?.trim()
    .toLowerCase();
  if (isSupportedLocale(preferred)) return preferred;
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get("accept-language"));
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
