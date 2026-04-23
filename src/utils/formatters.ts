import dayjs from "dayjs";

export const formatCurrency = (amount: number): string =>
  `${amount.toLocaleString("uz-UZ")} so'm`;

export const formatDate = (date: string): string =>
  dayjs(date).format("DD MMM YYYY");

export const formatDateTime = (date: string): string =>
  dayjs(date).format("DD MMM YYYY, HH:mm");
