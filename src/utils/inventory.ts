import type {
  InventorySummary,
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

import { formatInputAmount as _f, parseFormattedAmount as _p } from "./formatters";
export const formatInputAmount = _f;
export const parseFormattedAmount = _p;

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

  if (!input.name || input.name.trim().length === 0) {
    errors.name = "Mahsulot nomi majburiy";
  } else if (input.name.trim().length < 2) {
    errors.name = "Mahsulot nomi kamida 2 ta belgidan iborat bo'lishi kerak";
  }

  if (!input.buyPrice || input.buyPrice <= 0) {
    errors.buyPrice = "Sotib olish narxi 0 dan katta bo'lishi kerak";
  }

  if (!input.sellPrice || input.sellPrice <= 0) {
    errors.sellPrice = "Sotish narxi 0 dan katta bo'lishi kerak";
  } else if (input.sellPrice < input.buyPrice) {
    errors.sellPrice =
      "Sotish narxi sotib olish narxidan kam bo'lmasligi kerak";
  }

  if (input.quantity < 0) {
    errors.quantity = "Miqdor manfiy bo'lmasligi kerak";
  }

  return errors;
};

export const getInventoryMetrics = (
  item: InventoryWithProduct,
): InventoryMetrics => {
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

  const storedBuyPrice = typeof item.buyPrice === "number" && item.buyPrice > 0
    ? item.buyPrice
    : undefined;
  const storedSellPrice = typeof item.sellPrice === "number" && item.sellPrice > 0
    ? item.sellPrice
    : undefined;

  const p = item.product ?? { sellPrice: 0, buyPrice: 0 };
  const buyPrice = storedBuyPrice ?? p.buyPrice;
  const sellPrice = storedSellPrice ?? p.sellPrice;

  const remaining = Math.max(item.currentQuantity, 0);
  const sold = Math.max(item.startQuantity - item.currentQuantity, 0);
  const revenue = sold * sellPrice;
  const realizedProfit = sold * (sellPrice - buyPrice);
  const stockSellValue = remaining * sellPrice;
  const stockBuyValue = remaining * buyPrice;
  const potentialProfit = remaining * (sellPrice - buyPrice);

  return {
    remaining,
    sold,
    revenue,
    realizedProfit,
    stockSellValue,
    stockBuyValue,
    potentialProfit,
    marginPercent:
      sellPrice > 0
        ? Math.round(((sellPrice - buyPrice) / sellPrice) * 100)
        : 0,
  };
};

const getItemProductId = (item: InventoryWithProduct): string | undefined => {
  if (item.product) {
    return item.product.localId ?? item.product.id;
  }
  return item.productId;
};

const isItemNewerThan = (existing: InventoryWithProduct, item: InventoryWithProduct): boolean => {
  const existingDate = existing.date;
  const itemDate = item.date;

  if (itemDate && existingDate) {
    if (itemDate.localeCompare(existingDate) > 0) {
      return true;
    }
    if (itemDate.localeCompare(existingDate) === 0) {
      const existingUpdatedAt = existing.updatedAt ?? existing.createdAt;
      const itemUpdatedAt = item.updatedAt ?? item.createdAt;
      if (itemUpdatedAt && existingUpdatedAt) {
        return new Date(itemUpdatedAt).getTime() > new Date(existingUpdatedAt).getTime();
      }
    }
    return false;
  }

  const existingUpdatedAt = existing.updatedAt ?? existing.createdAt;
  const itemUpdatedAt = item.updatedAt ?? item.createdAt;

  if (itemUpdatedAt && existingUpdatedAt) {
    return new Date(itemUpdatedAt).getTime() > new Date(existingUpdatedAt).getTime();
  }

  return false;
};

const aggregateItemsByProduct = (
  items: InventoryWithProduct[],
): {
  start: number;
  current: number;
  sold: number;
  revenue: number;
  profit: number;
  stockSellValue: number;
  stockBuyValue: number;
  stockProfit: number;
} => {
  const uniqueByProductAndDate = new Map<string, InventoryWithProduct>();

  for (const item of items) {
    const productId = getItemProductId(item);
    if (!productId) continue;

    const date = item.date ?? "unknown";
    const key = `${productId}|||${date}`;

    const existing = uniqueByProductAndDate.get(key);
    if (!existing) {
      uniqueByProductAndDate.set(key, item);
      continue;
    }

    if (isItemNewerThan(existing, item)) {
      uniqueByProductAndDate.set(key, item);
    }
  }

  const deduplicatedItems = Array.from(uniqueByProductAndDate.values());

  const productLatestEntry = new Map<string, InventoryWithProduct>();
  const productTotalSold = new Map<string, number>();
  const productTotalRevenue = new Map<string, number>();
  const productTotalProfit = new Map<string, number>();

  for (const item of deduplicatedItems) {
    const productId = getItemProductId(item);
    if (!productId) continue;

    const metrics = getInventoryMetrics(item);

    productTotalSold.set(
      productId,
      (productTotalSold.get(productId) ?? 0) + metrics.sold
    );
    productTotalRevenue.set(
      productId,
      (productTotalRevenue.get(productId) ?? 0) + metrics.revenue
    );
    productTotalProfit.set(
      productId,
      (productTotalProfit.get(productId) ?? 0) + metrics.realizedProfit
    );

    const existing = productLatestEntry.get(productId);

    if (!existing) {
      productLatestEntry.set(productId, item);
      continue;
    }

    if (isItemNewerThan(existing, item)) {
      productLatestEntry.set(productId, item);
    }
  }

  let totalCurrent = 0;
  let totalSold = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalStockSellValue = 0;
  let totalStockBuyValue = 0;
  let totalStockProfit = 0;

  for (const [productId, latestEntry] of productLatestEntry) {
    const latestMetrics = getInventoryMetrics(latestEntry);
    const sold = productTotalSold.get(productId) ?? 0;
    const revenue = productTotalRevenue.get(productId) ?? 0;
    const profit = productTotalProfit.get(productId) ?? 0;

    totalCurrent += latestMetrics.remaining;
    totalStockSellValue += latestMetrics.stockSellValue;
    totalStockBuyValue += latestMetrics.stockBuyValue;
    totalStockProfit += latestMetrics.potentialProfit;
    totalSold += sold;
    totalRevenue += revenue;
    totalProfit += profit;
  }

  const totalStart = totalCurrent + totalSold;

  return {
    start: totalStart,
    current: totalCurrent,
    sold: totalSold,
    revenue: totalRevenue,
    profit: totalProfit,
    stockSellValue: totalStockSellValue,
    stockBuyValue: totalStockBuyValue,
    stockProfit: totalStockProfit,
  };
};

export const getInventoryTotals = (
  items: InventoryWithProduct[],
  summary?: InventorySummary | null,
) => {
  if (summary?.totalStart !== undefined) {
    return {
      start: summary.totalStart,
      current: summary.totalCurrent,
      sold: summary.totalSold,
      revenue: summary.totalRevenue ?? 0,
      profit: summary.totalProfit ?? 0,
      stockSellValue: summary.totalStockSellValue ?? 0,
      stockBuyValue: summary.totalStockBuyValue ?? 0,
      stockProfit: summary.totalStockProfit ?? 0,
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
      stockBuyValue: 0,
      stockProfit: 0,
    };
  }

  return aggregateItemsByProduct(items);
};

export type ProductStatisticsRow = {
  productId: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  jami: number;
  qoldi: number;
  sotildi: number;
  olinganNarxiSold: number;
  sotilganNarx: number;
  tozaFoyda: number;
  abarot: number;
  olinganNarxJami: number;
  foyda: number;
};

function getItemPrices(item: InventoryWithProduct) {
  const p = item.product;
  const buyPrice =
    typeof item.buyPrice === "number" && item.buyPrice > 0
      ? item.buyPrice
      : (p?.buyPrice ?? 0);
  const sellPrice =
    typeof item.sellPrice === "number" && item.sellPrice > 0
      ? item.sellPrice
      : (p?.sellPrice ?? 0);
  return { buyPrice, sellPrice };
}

export function buildProductStatisticsRows(
  items: InventoryWithProduct[],
  catalog: Product[] = [],
): ProductStatisticsRow[] {
  const uniqueByProductAndDate = new Map<string, InventoryWithProduct>();

  for (const item of items) {
    const productId = getItemProductId(item);
    if (!productId) continue;

    const date = item.date ?? "unknown";
    const key = `${productId}|||${date}`;
    const existing = uniqueByProductAndDate.get(key);
    if (!existing || isItemNewerThan(existing, item)) {
      uniqueByProductAndDate.set(key, item);
    }
  }

  const productLatestEntry = new Map<string, InventoryWithProduct>();
  const productTotals = new Map<
    string,
    { sold: number; revenue: number; profit: number; costSold: number }
  >();

  for (const item of uniqueByProductAndDate.values()) {
    const productId = getItemProductId(item);
    if (!productId) continue;

    const metrics = getInventoryMetrics(item);
    const { buyPrice } = getItemPrices(item);
    const totals = productTotals.get(productId) ?? {
      sold: 0,
      revenue: 0,
      profit: 0,
      costSold: 0,
    };
    totals.sold += metrics.sold;
    totals.revenue += metrics.revenue;
    totals.profit += metrics.realizedProfit;
    totals.costSold += metrics.sold * buyPrice;
    productTotals.set(productId, totals);

    const existing = productLatestEntry.get(productId);
    if (!existing || isItemNewerThan(existing, item)) {
      productLatestEntry.set(productId, item);
    }
  }

  const rows: ProductStatisticsRow[] = [];

  for (const [productId, latest] of productLatestEntry) {
    const metrics = getInventoryMetrics(latest);
    const { buyPrice, sellPrice } = getItemPrices(latest);
    const totals = productTotals.get(productId)!;
    const jami = Math.max(latest.startQuantity ?? 0, metrics.remaining + totals.sold);
    const abarot = jami * sellPrice;
    const olinganNarxJami = jami * buyPrice;

    rows.push({
      productId,
      name: latest.product?.name ?? "—",
      buyPrice,
      sellPrice,
      jami,
      qoldi: metrics.remaining,
      sotildi: totals.sold,
      olinganNarxiSold: totals.costSold,
      sotilganNarx: totals.revenue,
      tozaFoyda: totals.profit,
      abarot,
      olinganNarxJami,
      foyda: abarot - olinganNarxJami,
    });
  }

  const includedIds = new Set(rows.map((r) => r.productId));
  for (const product of catalog) {
    if (product.isDeleted || includedIds.has(product.localId)) continue;

    const jami = product.quantity ?? 0;
    rows.push({
      productId: product.localId,
      name: product.name,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      jami,
      qoldi: jami,
      sotildi: 0,
      olinganNarxiSold: 0,
      sotilganNarx: 0,
      tozaFoyda: 0,
      abarot: jami * product.sellPrice,
      olinganNarxJami: jami * product.buyPrice,
      foyda: jami * (product.sellPrice - product.buyPrice),
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name, "uz"));
  return rows;
}

