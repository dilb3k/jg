import { AppLanguage } from "@/store/settings.store";

export const formatDurationHM = (seconds: number, language: AppLanguage = "en"): string => {
  if (!seconds || seconds <= 0) {
    return language === "ru" ? "0 мин" : language === "uz" ? "0 daq" : "0 min";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    if (language === "ru") return `${hours} ч ${minutes} мин`;
    if (language === "uz") return `${hours} soat ${minutes} daq`;
    return `${hours}h ${minutes}m`;
  }

  if (language === "ru") return `${minutes} мин`;
  if (language === "uz") return `${minutes} daq`;
  return `${minutes} min`;
};

export const formatDurationClock = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "00:00";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
};

export const calculateProgressPercent = (current: number, total: number): number => {
  if (!total || total <= 0) return 0;
  return Math.min((current / total) * 100, 100);
};
