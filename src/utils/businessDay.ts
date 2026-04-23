import dayjs from "dayjs";

const BUSINESS_DAY_START_HOUR = 7;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getBusinessDayStartHour = () => BUSINESS_DAY_START_HOUR;

export const getBusinessDate = (input?: string | Date | dayjs.Dayjs): string => {
  if (typeof input === "string" && DATE_ONLY_PATTERN.test(input)) {
    return input;
  }
  const value = input ? dayjs(input) : dayjs();
  const adjusted =
    value.hour() < BUSINESS_DAY_START_HOUR ? value.subtract(1, "day") : value;
  return adjusted.format("YYYY-MM-DD");
};

export const getBusinessDayLabel = (date: string): string => date;

export const getBusinessDayMoment = (date?: string) =>
  dayjs(date || getBusinessDate(), "YYYY-MM-DD");

export const isPastBusinessDate = (date: string): boolean =>
  getBusinessDayMoment(date).isBefore(getBusinessDayMoment(), "day");

export const isTodayBusinessDate = (date: string): boolean =>
  getBusinessDayMoment(date).isSame(getBusinessDayMoment(), "day");

export const isFutureBusinessDate = (date: string): boolean =>
  getBusinessDayMoment(date).isAfter(getBusinessDayMoment(), "day");
