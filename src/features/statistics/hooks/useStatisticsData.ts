import { useEffect, useMemo, useState } from "react";

import dayjs from "dayjs";

import { apiClient } from "../../../api/client";
import type { InventoryWithProduct, Product, DailySnapshot } from "../../../types";
import { getBusinessDate } from "../../../utils/businessDay";
import { formatMoney, getInventoryTotals } from "../../../utils/inventory";
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
  overallStartDate: string | null;
  overallEndDate: string | null;
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
  const [overallInventory, setOverallInventory] = useState<InventoryWithProduct[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadOverallInventory = async () => {
      const targetDate = overallEndDate || getBusinessDate();
      try {
        const inventory = await apiClient.getInventoryWithProducts(targetDate);
        if (isMounted) {
          setOverallInventory(inventory);
        }
      } catch {
        if (isMounted) {
          setOverallInventory([]);
        }
      }
    };

    loadOverallInventory();

    return () => {
      isMounted = false;
    };
  }, [overallEndDate, products.length]);

  const periodStats = (period: PeriodType) => getStatistics(period, selectedDate);

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

  const overallRangeLabel = useMemo(() => {
    if (!overallStartDate && !overallEndDate) {
      return "Boshidan - Hozirgacha";
    }

    return `${overallStartDate ? dayjs(overallStartDate).format("DD MMM YYYY") : "Boshidan"} - ${overallEndDate ? dayjs(overallEndDate).format("DD MMM YYYY") : "Hozirgacha"}`;
  }, [overallEndDate, overallStartDate]);

  const overallInventoryStats = useMemo(
    () => getInventoryTotals(overallInventory),
    [overallInventory],
  );

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

    overallSnapshots.forEach((snapshot) => {
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

  const overallTotals = useMemo(() => {
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
  }, [overallInventoryStats, overallSnapshots]);

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
    periodStats,
    topProducts,
  };
}
