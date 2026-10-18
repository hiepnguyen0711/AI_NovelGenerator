import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type MessageTree = Record<string, unknown>;

// Deep-merge so that untranslated nested keys fall back to English
// (keeps the UI working when upstream adds new strings before vi.json catches up).
const mergeDeep = (base: MessageTree, override: MessageTree): MessageTree => {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = base[key];
    out[key] =
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue !== null &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
        ? mergeDeep(baseValue as MessageTree, value as MessageTree)
        : value;
  }
  return out;
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "zh" | "en" | "vi")) {
    locale = routing.defaultLocale;
  }

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages:
      locale === "vi"
        ? mergeDeep(
            (await import("./messages/en.json")).default as MessageTree,
            messages as MessageTree,
          )
        : messages,
  };
});
