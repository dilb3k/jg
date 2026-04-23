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
  selectedDate: string;
  overallStartDate: string | null;
  overallEndDate: string | null;
};

export function useStatisticsData({
  getStatistics,
  products,
  snapshots,
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

  const overallSoldByProduct = useMemo(
    () =>
      overallSnapshots.reduce<Record<string, { sold: number; profit: number }>>(
        (acc, snapshot) => {
          snapshot.items.forEach((item) => {
            const current = acc[item.productId] || { sold: 0, profit: 0 };
            current.sold += item.sold;
            current.profit += item.profit;
            acc[item.productId] = current;
          });

          return acc;
        },
        {},
      ),
    [overallSnapshots],
  );

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

    const rows = Object.entries(overallSoldByProduct)
      .map(([productId, totals]) => ({
        id: productId,
        name: namesById.get(productId) || "Noma'lum mahsulot",
        sold: totals.sold,
        profit: totals.profit,
      }))
      .filter((item) => item.sold > 0 || item.profit > 0);

    return {
      topSold: [...rows].sort((a, b) => b.sold - a.sold).slice(0, 5),
      topProfit: [...rows].sort((a, b) => b.profit - a.profit).slice(0, 5),
    };
  }, [overallSnapshots, overallSoldByProduct, products]);

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
    const possibleProfit = earnedProfit + overallInventoryStats.stockProfit;
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

  const rankingCards = useMemo(
    () => ({
      topSold: productRanking.topSold.map((item) => ({
        id: item.id,
        name: item.name,
        valueText: `${item.sold} ta sotilgan`,
      })),
      topProfit: productRanking.topProfit.map((item) => ({
        id: item.id,
        name: item.name,
        valueText: formatMoney(item.profit),
      })),
    }),
    [productRanking.topProfit, productRanking.topSold],
  );

  return {
    overallRangeLabel,
    overallTotals,
    periodStats,
    rankingCards,
  };
}
