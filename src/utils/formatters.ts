import dayjs from "dayjs";

export const formatCurrency = (amount: number): string =>
  `${formatAmount(amount)} so'm`;

export const formatDate = (date: string): string =>
  dayjs(date).format("DD MMM YYYY");

export const formatDateTime = (date: string): string =>
  dayjs(date).format("DD MMM YYYY, HH:mm");

export const formatAmount = (value: number | string): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("uz-UZ");
};

export const formatInputAmount = (value: string): string => {
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned) return "";
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return "";
  return num.toLocaleString("uz-UZ");
};

export const parseFormattedAmount = (value: string): number => {
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned) return 0;
  return parseInt(cleaned, 10);
};
