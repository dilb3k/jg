import type { InventoryWithProduct, ProductInput } from "../types";

export const normalizeDigits = (value: string): string =>
  value.replace(/[^\d]/g, "");

export const parseWholeNumber = (value: string): number => {
  const normalized = normalizeDigits(value);
  return normalized ? parseInt(normalized, 10) : 0;
};

export const formatWholeNumber = (value: number): string =>
  value.toLocaleString("uz-UZ");

export const formatMoney = (value: number): string =>
  `${value.toLocaleString("uz-UZ")} so'm`;

export const getInventoryMetrics = (item: InventoryWithProduct) => {
  const remaining = Math.max(item.currentQuantity, 0);
  const sold = Math.max(item.startQuantity - item.currentQuantity, 0);
  const revenue = sold * item.product.sellPrice;
  const realizedProfit = sold * (item.product.sellPrice - item.product.buyPrice);
  const stockSellValue = remaining * item.product.sellPrice;
  const stockBuyValue = remaining * item.product.buyPrice;
  const potentialProfit = remaining * (item.product.sellPrice - item.product.buyPrice);

  return {
    remaining,
    sold,
    revenue,
    realizedProfit,
    stockSellValue,
    stockBuyValue,
    potentialProfit,
    marginPercent:
      item.product.sellPrice > 0
        ? Math.round(
            ((item.product.sellPrice - item.product.buyPrice) /
              item.product.sellPrice) *
              100,
          )
        : 0,
  };
};

export const getInventoryTotals = (items: InventoryWithProduct[]) =>
  items.reduce(
    (acc, item) => {
      const metrics = getInventoryMetrics(item);
      return {
        start: acc.start + item.startQuantity,
        current: acc.current + metrics.remaining,
        sold: acc.sold + metrics.sold,
        revenue: acc.revenue + metrics.revenue,
        profit: acc.profit + metrics.realizedProfit,
        stockSellValue: acc.stockSellValue + metrics.stockSellValue,
        stockBuyValue: acc.stockBuyValue + metrics.stockBuyValue,
        stockProfit: acc.stockProfit + metrics.potentialProfit,
      };
    },
    {
      start: 0,
      current: 0,
      sold: 0,
      revenue: 0,
      profit: 0,
      stockSellValue: 0,
      stockBuyValue: 0,
      stockProfit: 0,
    },
  );

export const validateProductInput = (
  input: Partial<ProductInput>,
): Record<"name" | "buyPrice" | "sellPrice" | "quantity", string> => {
  const errors = {
    name: "",
    buyPrice: "",
    sellPrice: "",
    quantity: "",
  };

  const name = String(input.name ?? "").trim();
  const buyPrice = Number(input.buyPrice);
  const sellPrice = Number(input.sellPrice);
  const quantity = Number(input.quantity ?? 0);

  if (!name) {
    errors.name = "Mahsulot nomini kiriting";
  }

  if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
    errors.buyPrice = "Kelish narxi 0 dan katta bo'lishi kerak";
  }

  if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
    errors.sellPrice = "Sotish narxi 0 dan katta bo'lishi kerak";
  } else if (Number.isFinite(buyPrice) && sellPrice < buyPrice) {
    errors.sellPrice = "Sotish narxi kelish narxidan past bo'lishi mumkin emas";
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = "Miqdor manfiy bo'lishi mumkin emas";
  }

  return errors;
};

export const hasValidationErrors = (errors: Record<string, string>) =>
  Object.values(errors).some(Boolean);
