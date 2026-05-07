import type {
  InventoryWithProduct,
  InventoryMetrics,
  Product,
} from "../types/index";

export interface ProductValidationErrors {
  name: string;
  buyPrice: string;
  sellPrice: string;
  quantity: string;
}

// ==================== FORMAT VA NORMALIZE FUNKSIYALARI ====================

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

// ==================== VALIDATION ====================

export const hasValidationErrors = (
  errors: ProductValidationErrors,
): boolean => {
  return Object.values(errors).some((error) => error !== "");
};

export const validateProductInput = (input: {
  name: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
}): ProductValidationErrors => {
  const errors: ProductValidationErrors = {
    name: "",
    buyPrice: "",
    sellPrice: "",
    quantity: "",
  };

  // Mahsulot nomi
  if (!input.name || input.name.trim().length === 0) {
    errors.name = "Mahsulot nomi majburiy";
  } else if (input.name.trim().length < 2) {
    errors.name = "Mahsulot nomi kamida 2 ta belgidan iborat bo'lishi kerak";
  }

  // Sotib olish narxi
  if (!input.buyPrice || input.buyPrice <= 0) {
    errors.buyPrice = "Sotib olish narxi 0 dan katta bo'lishi kerak";
  }

  // Sotish narxi
  if (!input.sellPrice || input.sellPrice <= 0) {
    errors.sellPrice = "Sotish narxi 0 dan katta bo'lishi kerak";
  } else if (input.sellPrice < input.buyPrice) {
    errors.sellPrice =
      "Sotish narxi sotib olish narxidan kam bo'lmasligi kerak";
  }

  // Miqdor
  if (input.quantity < 0) {
    errors.quantity = "Miqdor manfiy bo'lmasligi kerak";
  }

  return errors;
};

// ==================== INVENTORY METRIKALARI ====================

export const getInventoryMetrics = (
  item: InventoryWithProduct,
): InventoryMetrics => {
  // Backend hisoblab bergan bo'lsa
  if (typeof item.sold === "number" && typeof item.remaining === "number") {
    return {
      remaining: item.remaining,
      sold: item.sold,
      revenue: item.revenue ?? 0,
      realizedProfit: item.realizedProfit ?? 0,
      stockSellValue: item.stockSellValue ?? 0,
      stockBuyValue: item.stockBuyValue ?? 0,
      potentialProfit: item.potentialProfit ?? 0,
      marginPercent: item.marginPercent ?? 0,
    };
  }

  // Fallback hisoblash
  const remaining = Math.max(item.currentQuantity, 0);
  const sold = Math.max(item.startQuantity - item.currentQuantity, 0);
  const revenue = sold * item.product.sellPrice;
  const realizedProfit =
    sold * (item.product.sellPrice - item.product.buyPrice);
  const stockSellValue = remaining * item.product.sellPrice;
  const stockBuyValue = remaining * item.product.buyPrice;
  const potentialProfit =
    remaining * (item.product.sellPrice - item.product.buyPrice);

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

export const getInventoryTotals = (
  items: InventoryWithProduct[],
  summary?: any,
) => {
  if (summary?.totalStart !== undefined) {
    return {
      start: summary.totalStart,
      current: summary.totalCurrent,
      sold: summary.totalSold,
      revenue: summary.totalRevenue ?? 0,
      profit: summary.totalProfit ?? 0,
      stockSellValue: summary.totalStockSellValue ?? 0,
    };
  }

  if (items.length === 0) {
    return {
      start: 0,
      current: 0,
      sold: 0,
      revenue: 0,
      profit: 0,
      stockSellValue: 0,
    };
  }

  if (typeof items[0]?.sold === "number") {
    return items.reduce(
      (acc, item) => ({
        start: acc.start + item.startQuantity,
        current: acc.current + item.currentQuantity,
        sold: acc.sold + (item.sold || 0),
        revenue: acc.revenue + (item.revenue || 0),
        profit: acc.profit + (item.realizedProfit || 0),
        stockSellValue: acc.stockSellValue + (item.stockSellValue || 0),
      }),
      {
        start: 0,
        current: 0,
        sold: 0,
        revenue: 0,
        profit: 0,
        stockSellValue: 0,
      },
    );
  }

  return items.reduce(
    (acc, item) => {
      const m = getInventoryMetrics(item);
      return {
        start: acc.start + item.startQuantity,
        current: acc.current + m.remaining,
        sold: acc.sold + m.sold,
        revenue: acc.revenue + m.revenue,
        profit: acc.profit + m.realizedProfit,
        stockSellValue: acc.stockSellValue + m.stockSellValue,
      };
    },
    {
      start: 0,
      current: 0,
      sold: 0,
      revenue: 0,
      profit: 0,
      stockSellValue: 0,
    },
  );
};
