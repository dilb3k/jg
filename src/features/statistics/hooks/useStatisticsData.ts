import { useEffect, useMemo, useState } from "react";

import dayjs from "dayjs";

import { apiClient } from "../../../api/client";
import type {
  InventorySummary,
  InventoryWithProduct,
  Product,
  DailySnapshot,
} from "../../../types";
import { getInventoryMetrics, getInventoryTotals } from "../../../utils/inventory";
import type { PeriodType } from "../components/PeriodTabs";

type InventoryRangeResult = {
  items: InventoryWithProduct[];
  summary?: InventorySummary;
};

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
  refreshToken?: number;
};

export const getPeriodRange = (period: PeriodType, selectedDate: string) => {
  const baseDate = dayjs(selectedDate);
  switch (period) {
    case "daily":
      return { from: selectedDate, to: selectedDate };
    case "weekly":
      return {
        from: baseDate.startOf("week").format("YYYY-MM-DD"),
        to: baseDate.endOf("week").format("YYYY-MM-DD"),
      };
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

function mergeInventoryStats(
  items: InventoryWithProduct[],
  stats: Map<string, { sold: number; profit: number }>,
) {
  for (const item of items) {
    const metrics = getInventoryMetrics(item);
    const id = item.productId || item.product?.localId;
    if (!id) continue;
    const current = stats.get(id) ?? { sold: 0, profit: 0 };
    current.sold += metrics.sold;
    current.profit += metrics.realizedProfit;
    stats.set(id, current);
  }
}

function buildAllProductPeriodStats(
  products: Product[],
  snapshots: DailySnapshot[],
  inventoryItems: InventoryWithProduct[],
): ProductRankRow[] {
  const namesById = new Map<string, string>();
  const stats = new Map<string, { sold: number; profit: number }>();

  products
    .filter((p) => !p.isDeleted)
    .forEach((p) => {
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

  if (snapshots.length === 0 && inventoryItems.length > 0) {
    mergeInventoryStats(inventoryItems, stats);
  }

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
  refreshToken = 0,
}: Params) {
  const periodDateRange = useMemo(
    () => getPeriodRange(period, selectedDate),
    [period, selectedDate],
  );

  const [inventoryRange, setInventoryRange] = useState<InventoryRangeResult | null>(null);
  const [inventoryAttempted, setInventoryAttempted] = useState(false);

  useEffect(() => {
    setInventoryRange(null);
    setInventoryAttempted(false);

    let isMounted = true;

    const load = async () => {
      if (!isPayed) {
        if (isMounted) setInventoryAttempted(true);
        return;
      }
      try {
        const result = await apiClient.getInventoryWithProducts(periodDateRange);
        if (isMounted) {
          setInventoryRange(result);
        }
      } catch {
        if (isMounted) {
          setInventoryRange(null);
        }
      } finally {
        if (isMounted) {
          setInventoryAttempted(true);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [periodDateRange, isPayed, refreshToken]);

  const periodSnapshots = useMemo(() => {
    const baseDate = dayjs(selectedDate);
    const start =
      period === "daily"
        ? baseDate.startOf("day")
        : period === "weekly"
          ? baseDate.startOf("week")
          : period === "monthly"
            ? baseDate.startOf("month")
            : baseDate.startOf("year");
    const end =
      period === "daily"
        ? baseDate.endOf("day")
        : period === "weekly"
          ? baseDate.endOf("week")
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

  const allProductStats = useMemo(
    () =>
      buildAllProductPeriodStats(
        products,
        periodSnapshots,
        inventoryRange?.items ?? [],
      ),
    [products, periodSnapshots, inventoryRange],
  );

  const inventoryItems = useMemo(
    () => inventoryRange?.items ?? [],
    [inventoryRange],
  );

  const inventorySummary = inventoryRange?.summary;

  const inventoryStats = useMemo(
    () => getInventoryTotals(inventoryItems, inventorySummary),
    [inventoryItems, inventorySummary],
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
      return {
        totalRevenue: inventoryStats.revenue,
        totalProfit: inventoryStats.profit,
        totalSoldItems: inventoryStats.sold,
      };
    }
    return getStatistics(period, selectedDate);
  }, [inventorySummary, inventoryItems, inventoryStats, period, selectedDate, getStatistics]);

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
      return {
        earnedRevenue: inventoryStats.revenue,
        earnedProfit: inventoryStats.profit,
        soldItems: inventoryStats.sold,
        remainingItems: inventoryStats.current,
        sellableItems: inventoryStats.sold + inventoryStats.current,
        sellableValue: inventoryStats.revenue + inventoryStats.stockSellValue,
        possibleProfit: inventoryStats.profit + inventoryStats.stockProfit,
        stockValue: inventoryStats.stockSellValue,
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
  }, [inventoryAttempted, inventoryStats, inventorySummary, inventoryItems, periodSnapshots]);

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

  /** Qora ro'yxat: eng kam foyda, shu jumladan umuman sotilmagan mahsulotlar */
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
  };
}
