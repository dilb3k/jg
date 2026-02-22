import { useSettingsStore } from "@/store/settings.store";
import { translations } from "./translations";

export function useI18n() {
  const language = useSettingsStore((state) => state.language);

  const t = (key: string, params?: Record<string, string | number>) => {
    const template = translations[language][key] ?? translations.ru[key] ?? key;
    if (!params) return template;

    return Object.entries(params).reduce((acc, [paramKey, value]) => {
      return acc.replaceAll(`{${paramKey}}`, String(value));
    }, template);
  };

  return { t, language };
}
