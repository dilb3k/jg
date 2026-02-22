import { useSettingsStore } from "@/store/settings.store";
import { translations } from "./translations";

export function useI18n() {
  const language = useSettingsStore((state) => state.language);

  const t = (key: string) => {
    return translations[language][key] ?? translations.ru[key] ?? key;
  };

  return { t, language };
}
