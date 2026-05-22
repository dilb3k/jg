import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import dayjs from "dayjs";

import { apiClient } from "../../../api/client";
import type {
  InventorySummary,
  InventoryWithProduct,
  Product,
  DailySnapshot,
} from "../../../types";
import type { PeriodType } from "../components/PeriodTabs";

type Params = {
  getStatistics: (
    period: PeriodType,
    date?: string,
  ) => {
    totalRevenue: number;
    totalProfit: number;
    totalSoldItems: number;
  };
  products: Product[];
  snapshots: DailySnapshot[];
  period: PeriodType;
  selectedDate: string;
  isPayed: boolean;
};

export const getPeriodRange = (period: PeriodType, selectedDate: string) => {
  const baseDate = dayjs(selectedDate);
  switch (period) {
    case "daily":
      return { from: selectedDate, to: selectedDate };
    case "monthly":
      return {
        from: baseDate.startOf("month").format("YYYY-MM-DD"),
        to: baseDate.endOf("month").format("YYYY-MM-DD"),
      };
    case "yearly":
      return {
        from: baseDate.startOf("year").format("YYYY-MM-DD"),
        to: baseDate.endOf("year").format("YYYY-MM-DD"),
      };
  }
};

export type ProductRankRow = {
  id: string;
  name: string;
  sold: number;
  profit: number;
};

function buildAllProductPeriodStats(
  products: Product[],
  snapshots: DailySnapshot[],
  inventoryItems: InventoryWithProduct[],
): ProductRankRow[] {
  const namesById = new Map<string, string>();
  const stats = new Map<string, { sold: number; profit: number }>();

  products.forEach((p) => {
    namesById.set(p.localId, p.name);
    stats.set(p.localId, { sold: 0, profit: 0 });
  });

  snapshots.forEach((snapshot) => {
    snapshot.items.forEach((item) => {
      if (!namesById.has(item.productId)) {
        namesById.set(item.productId, item.productName);
      }
      const current = stats.get(item.productId) ?? { sold: 0, profit: 0 };
      current.sold += item.sold;
      current.profit += item.profit;
      stats.set(item.productId, current);
    });
  });

  inventoryItems.forEach((item) => {
    const id = item.productId || item.product?.localId;
    if (!id) return;
    if (!namesById.has(id)) {
      namesById.set(id, item.product?.name || item.name || "Noma'lum");
    }
    const current = stats.get(id) ?? { sold: 0, profit: 0 };
    current.sold += item.sold ?? 0;
    current.profit += item.realizedProfit ?? 0;
    stats.set(id, current);
  });

  return Array.from(stats.entries()).map(([id, totals]) => ({
    id,
    name: namesById.get(id) || "Noma'lum mahsulot",
    sold: totals.sold,
    profit: totals.profit,
  }));
}

export function useStatisticsData({
  getStatistics,
  products,
  snapshots,
  period,
  selectedDate,
  isPayed,
}: Params) {
  const periodDateRange = useMemo(
    () => getPeriodRange(period, selectedDate),
    [period, selectedDate],
  );

  const [inventoryRange, setInventoryRange] = useState<{
    items: InventoryWithProduct[];
    summary?: InventorySummary;
  } | null>(null);
  const [inventoryAttempted, setInventoryAttempted] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchInventory = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setInventoryRange(null);
    setInventoryAttempted(false);

    if (!isPayed) {
      setInventoryAttempted(true);
      return;
    }
    try {
      const result = await apiClient.getInventoryWithProducts(periodDateRange);
      if (fetchId !== fetchIdRef.current) return;
      setInventoryRange(result);
    } catch {
      if (fetchId !== fetchIdRef.current) return;
      setInventoryRange(null);
    } finally {
      if (fetchId !== fetchIdRef.current) return;
      setInventoryAttempted(true);
    }
  }, [periodDateRange, isPayed, snapshots, products]);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const periodSnapshots = useMemo(() => {
    const baseDate = dayjs(selectedDate);
    const start =
      period === "daily"
        ? baseDate.startOf("day")
        : period === "monthly"
          ? baseDate.startOf("month")
          : baseDate.startOf("year");
    const end =
      period === "daily"
        ? baseDate.endOf("day")
        : period === "monthly"
          ? baseDate.endOf("month")
          : baseDate.endOf("year");

    return snapshots.filter((snapshot) => {
      const date = dayjs(snapshot.date);
      return (
        (date.isAfter(start) || date.isSame(start, "day")) &&
        (date.isBefore(end) || date.isSame(end, "day"))
      );
    });
  }, [period, selectedDate, snapshots]);

  const inventoryItems = useMemo(
    () => inventoryRange?.items ?? [],
    [inventoryRange],
  );

  const inventorySummary = inventoryRange?.summary;

  const allProductStats = useMemo(
    () =>
      buildAllProductPeriodStats(products, periodSnapshots, inventoryItems),
    [products, periodSnapshots, inventoryItems],
  );

  const currentPeriodStats = useMemo(() => {
    if (inventorySummary) {
      return {
        totalRevenue: inventorySummary.totalRevenue,
        totalProfit: inventorySummary.totalProfit,
        totalSoldItems: inventorySummary.totalSold,
      };
    }
    if (inventoryItems.length > 0) {
      const sold = inventoryItems.reduce((s, i) => s + (i.sold ?? 0), 0);
      const revenue = inventoryItems.reduce((s, i) => s + (i.revenue ?? 0), 0);
      const profit = inventoryItems.reduce(
        (s, i) => s + (i.realizedProfit ?? 0),
        0,
      );
      return { totalRevenue: revenue, totalProfit: profit, totalSoldItems: sold };
    }
    return getStatistics(period, selectedDate);
  }, [inventorySummary, inventoryItems, period, selectedDate, getStatistics]);

  const overallTotals = useMemo(() => {
    if (!inventoryAttempted) return null;

    if (inventorySummary) {
      return {
        earnedRevenue: inventorySummary.totalRevenue,
        earnedProfit: inventorySummary.totalProfit,
        soldItems: inventorySummary.totalSold,
        remainingItems: inventorySummary.totalCurrent,
        sellableItems: inventorySummary.totalSold + inventorySummary.totalCurrent,
        sellableValue:
          inventorySummary.totalRevenue + inventorySummary.totalStockSellValue,
        possibleProfit:
          inventorySummary.totalProfit + inventorySummary.totalStockProfit,
        stockValue: inventorySummary.totalStockSellValue,
      };
    }

    if (inventoryItems.length > 0) {
      const sold = inventoryItems.reduce((s, i) => s + (i.sold ?? 0), 0);
      const revenue = inventoryItems.reduce((s, i) => s + (i.revenue ?? 0), 0);
      const profit = inventoryItems.reduce(
        (s, i) => s + (i.realizedProfit ?? 0),
        0,
      );
      const remaining = inventoryItems.reduce(
        (s, i) => s + (i.remaining ?? i.currentQuantity ?? 0),
        0,
      );
      const stockSellValue = inventoryItems.reduce(
        (s, i) => s + (i.stockSellValue ?? 0),
        0,
      );
      const stockProfit = inventoryItems.reduce(
        (s, i) => s + (i.potentialProfit ?? 0),
        0,
      );
      return {
        earnedRevenue: revenue,
        earnedProfit: profit,
        soldItems: sold,
        remainingItems: remaining,
        sellableItems: sold + remaining,
        sellableValue: revenue + stockSellValue,
        possibleProfit: profit + stockProfit,
        stockValue: stockSellValue,
      };
    }

    const earnedProfit = periodSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.totalProfit,
      0,
    );
    const soldItems = periodSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.totalSoldItems,
      0,
    );
    const earnedRevenue = periodSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.totalRevenue,
      0,
    );

    return {
      earnedProfit,
      earnedRevenue,
      soldItems,
      remainingItems: 0,
      sellableItems: soldItems,
      sellableValue: earnedRevenue,
      possibleProfit: earnedProfit,
      stockValue: 0,
    };
  }, [inventoryAttempted, inventorySummary, inventoryItems, periodSnapshots]);

  const isLoading = !inventoryAttempted;

  const topProducts = useMemo(
    () =>
      allProductStats
        .filter((item) => item.sold > 0)
        .sort((a, b) =>
          b.sold === a.sold ? b.profit - a.profit : b.sold - a.sold,
        ),
    [allProductStats],
  );

  const leastProducts = useMemo(
    () =>
      [...allProductStats].sort(
        (a, b) => a.profit - b.profit || a.sold - b.sold,
      ),
    [allProductStats],
  );

  return {
    overallTotals,
    currentPeriodStats,
    topProducts,
    leastProducts,
    inventoryItems,
    periodSnapshots,
    isLoading,
    fetchInventory,
  };
}
