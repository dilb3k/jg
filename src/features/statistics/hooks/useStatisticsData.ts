import { useEffect, useMemo, useState } from "react";

import dayjs from "dayjs";

import { apiClient } from "../../../api/client";
import type {
  InventorySummary,
  InventoryWithProduct,
  Product,
  DailySnapshot,
} from "../../../types";
import { formatMoney, getInventoryTotals } from "../../../utils/inventory";
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
  overallStartDate: string | null;
  overallEndDate: string | null;
};

const getPeriodRange = (period: PeriodType, selectedDate: string) => {
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

export function useStatisticsData({
  getStatistics,
  products,
  snapshots,
  period,
  selectedDate,
  overallStartDate,
  overallEndDate,
}: Params) {
  const [overallRange, setOverallRange] = useState<InventoryRangeResult | null>(null);
  const [overallAttempted, setOverallAttempted] = useState(false);
  const [periodRange, setPeriodRange] = useState<InventoryRangeResult | null>(null);
  const [periodAttempted, setPeriodAttempted] = useState(false);

  useEffect(() => {
    setOverallRange(null);
    setOverallAttempted(false);

    let isMounted = true;

    const loadOverall = async () => {
      try {
        const params: { from?: string; to?: string } = {};
        if (overallStartDate) params.from = overallStartDate;
        if (overallEndDate) params.to = overallEndDate;

        const result = await apiClient.getInventoryWithProducts(params);
        if (isMounted) {
          setOverallRange(result);
        }
      } catch {
        if (isMounted) {
          setOverallRange(null);
        }
      } finally {
        if (isMounted) {
          setOverallAttempted(true);
        }
      }
    };

    loadOverall();

    return () => {
      isMounted = false;
    };
  }, [overallStartDate, overallEndDate]);

  const periodDateRange = useMemo(
    () => getPeriodRange(period, selectedDate),
    [period, selectedDate],
  );

  useEffect(() => {
    setPeriodRange(null);
    setPeriodAttempted(false);

    let isMounted = true;

    const loadPeriod = async () => {
      try {
        const result = await apiClient.getInventoryWithProducts(periodDateRange);
        if (isMounted) {
          setPeriodRange(result);
        }
      } catch {
        if (isMounted) {
          setPeriodRange(null);
        }
      } finally {
        if (isMounted) {
          setPeriodAttempted(true);
        }
      }
    };

    loadPeriod();

    return () => {
      isMounted = false;
    };
  }, [periodDateRange]);

  const overallSnapshots = useMemo(
    () =>
      snapshots.filter((snapshot) => {
        if (overallStartDate && dayjs(snapshot.date).isBefore(dayjs(overallStartDate))) {
          return false;
        }

        if (overallEndDate && dayjs(snapshot.date).isAfter(dayjs(overallEndDate))) {
          return false;
        }

        return true;
      }),
    [overallEndDate, overallStartDate, snapshots],
  );

  const overallSummary = overallRange?.summary;

  const overallInventory = useMemo(
    () => overallRange?.items ?? [],
    [overallRange],
  );

  const overallInventoryStats = useMemo(
    () => getInventoryTotals(overallInventory, overallSummary),
    [overallInventory, overallSummary],
  );

  const overallRangeLabel = useMemo(() => {
    if (!overallStartDate && !overallEndDate) {
      return "Boshidan - Hozirgacha";
    }

    return `${overallStartDate ? dayjs(overallStartDate).format("DD MMM YYYY") : "Boshidan"} - ${overallEndDate ? dayjs(overallEndDate).format("DD MMM YYYY") : "Hozirgacha"}`;
  }, [overallEndDate, overallStartDate]);

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

  const productRanking = useMemo(() => {
    const namesById = new Map<string, string>();

    periodSnapshots.forEach((snapshot) => {
      snapshot.items.forEach((item) => {
        if (!namesById.has(item.productId)) {
          namesById.set(item.productId, item.productName);
        }
      });
    });

    products.forEach((product) => {
      if (!namesById.has(product.localId)) {
        namesById.set(product.localId, product.name);
      }
    });

    const rows = periodSnapshots
      .reduce<Record<string, { sold: number; profit: number }>>((acc, snapshot) => {
        snapshot.items.forEach((item) => {
          const current = acc[item.productId] || { sold: 0, profit: 0 };
          current.sold += item.sold;
          current.profit += item.profit;
          acc[item.productId] = current;
        });
        return acc;
      }, {});

    return Object.entries(rows)
      .map(([productId, totals]) => ({
        id: productId,
        name: namesById.get(productId) || "Noma'lum mahsulot",
        sold: totals.sold,
        profit: totals.profit,
      }))
      .filter((item) => item.sold > 0 || item.profit > 0)
      .sort((a, b) => (b.sold === a.sold ? b.profit - a.profit : b.sold - a.sold));
  }, [periodSnapshots, products]);

  const currentPeriodStats = useMemo(() => {
    if (periodRange?.summary) {
      return {
        totalRevenue: periodRange.summary.totalRevenue,
        totalProfit: periodRange.summary.totalProfit,
        totalSoldItems: periodRange.summary.totalSold,
      };
    }
    return getStatistics(period, selectedDate);
  }, [periodRange, period, selectedDate, getStatistics, snapshots]);

  const overallTotals = useMemo(() => {
    if (overallSummary) {
      return {
        earnedRevenue: overallSummary.totalRevenue,
        earnedProfit: overallSummary.totalProfit,
        soldItems: overallSummary.totalSold,
        remainingItems: overallSummary.totalCurrent,
        sellableItems: overallSummary.totalSold + overallSummary.totalCurrent,
        sellableValue: overallSummary.totalRevenue + overallSummary.totalStockSellValue,
        possibleProfit: overallSummary.totalProfit + overallSummary.totalStockProfit,
        stockValue: overallSummary.totalStockSellValue,
      };
    }

    if (!overallAttempted) return null;

    const earnedProfit = overallSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.totalProfit,
      0,
    );
    const soldItems = overallSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.totalSoldItems,
      0,
    );
    const earnedRevenue = overallSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.totalRevenue,
      0,
    );
    const remainingItems = overallInventoryStats.current;
    const sellableItems = soldItems + remainingItems;
    const possibleProfit = earnedProfit + (overallInventoryStats.stockProfit ?? 0);
    const sellableValue = earnedRevenue + overallInventoryStats.stockSellValue;

    return {
      earnedProfit,
      earnedRevenue,
      soldItems,
      remainingItems,
      sellableItems,
      sellableValue,
      possibleProfit,
      stockValue: overallInventoryStats.stockSellValue,
    };
  }, [overallAttempted, overallInventoryStats, overallSnapshots, overallSummary]);

  const isLoading = !overallAttempted || !periodAttempted;

  const topProducts = useMemo(
    () =>
      productRanking.map((item) => ({
        id: item.id,
        name: item.name,
        valueText: `${item.sold} ta sotilgan • ${formatMoney(item.profit)}`,
      })),
    [productRanking],
  );

  return {
    overallRangeLabel,
    overallTotals,
    currentPeriodStats,
    topProducts,
    isLoading,
  };
}
