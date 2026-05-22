import dayjs from "dayjs";

import type { DailySnapshot, InventoryWithProduct, Product } from "../types";
import {
  buildProductStatisticsRows,
  type ProductStatisticsRow,
} from "./inventory";

export { shareStatisticsFile } from "./shareStatisticsFile";
export type StatisticsExportFormat = "csv" | "txt";

export type StatisticsDailyExportRow = {
  date: string;
  sold: number;
  profit: number;
  abarot: number;
};

export type FullStatisticsExportPayload = {
  periodLabel: string;
  productRows: ProductStatisticsRow[];
  dailyRows: StatisticsDailyExportRow[];
  labels: {
    title: string;
    period: string;
    colNo: string;
    colName: string;
    colBuy: string;
    colSell: string;
    colJami: string;
    colQoldi: string;
    colSotildi: string;
    colCostSold: string;
    colRevenue: string;
    colNetProfit: string;
    colTurnover: string;
    colCostTotal: string;
    colProfit: string;
    totalRow: string;
    dailyTitle: string;
    colDate: string;
    colDailySold: string;
    colDailyProfit: string;
    colDailyTurnover: string;
  };
};

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function buildRowsFromSnapshots(
  snapshots: DailySnapshot[],
  catalog: Product[],
): ProductStatisticsRow[] {
  const namesById = new Map<string, string>();
  catalog.forEach((p) => namesById.set(p.localId, p.name));

  const totals = new Map<
    string,
    { sold: number; revenue: number; profit: number; buyPrice: number; sellPrice: number }
  >();

  snapshots.forEach((snapshot) => {
    snapshot.items.forEach((item) => {
      const current = totals.get(item.productId) ?? {
        sold: 0,
        revenue: 0,
        profit: 0,
        buyPrice: item.buyPrice ?? 0,
        sellPrice: item.sellPrice ?? 0,
      };
      current.sold += item.sold;
      current.revenue += item.revenue;
      current.profit += item.profit;
      if (item.buyPrice) current.buyPrice = item.buyPrice;
      if (item.sellPrice) current.sellPrice = item.sellPrice;
      if (!namesById.has(item.productId)) {
        namesById.set(item.productId, item.productName);
      }
      totals.set(item.productId, current);
    });
  });

  const rows: ProductStatisticsRow[] = [];
  for (const [productId, t] of totals) {
    const catalogProduct = catalog.find((p) => p.localId === productId);
    const buyPrice = t.buyPrice || catalogProduct?.buyPrice || 0;
    const sellPrice = t.sellPrice || catalogProduct?.sellPrice || 0;
    const jami = t.sold;
    rows.push({
      productId,
      name: namesById.get(productId) ?? catalogProduct?.name ?? "—",
      buyPrice,
      sellPrice,
      jami,
      qoldi: 0,
      sotildi: t.sold,
      olinganNarxiSold: t.sold * buyPrice,
      sotilganNarx: t.revenue,
      tozaFoyda: t.profit,
      abarot: jami * sellPrice,
      olinganNarxJami: jami * buyPrice,
      foyda: jami * (sellPrice - buyPrice),
    });
  }

  const includedIds = new Set(rows.map((r) => r.productId));
  for (const product of catalog) {
    if (includedIds.has(product.localId)) continue;
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

export function buildStatisticsProductRows(
  inventoryItems: InventoryWithProduct[],
  snapshots: DailySnapshot[],
  catalog: Product[],
): ProductStatisticsRow[] {
  if (inventoryItems.length > 0) {
    return buildProductStatisticsRows(inventoryItems, catalog, false);
  }
  if (snapshots.length > 0) {
    return buildRowsFromSnapshots(snapshots, catalog);
  }
  return [];
}

export function buildStatisticsDailyRows(snapshots: DailySnapshot[]): StatisticsDailyExportRow[] {
  return [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((snapshot) => ({
      date: dayjs(snapshot.date).format("DD/MM/YYYY"),
      sold: snapshot.totalSoldItems,
      profit: snapshot.totalProfit,
      abarot: snapshot.totalRevenue,
    }));
}

export function buildStatisticsCsv(payload: FullStatisticsExportPayload): string {
  const { periodLabel, productRows, labels } = payload;
  const rows: string[] = [];

  rows.push(csvRow([labels.title]));
  rows.push(csvRow([labels.period, periodLabel]));
  rows.push("");

  rows.push(
    csvRow([
      labels.colNo,
      labels.colName,
      labels.colBuy,
      labels.colSell,
      labels.colJami,
      labels.colQoldi,
      labels.colSotildi,
      labels.colCostSold,
      labels.colRevenue,
      labels.colNetProfit,
      labels.colTurnover,
      labels.colCostTotal,
      labels.colProfit,
    ]),
  );

  let sumJami = 0;
  let sumQoldi = 0;
  let sumSotildi = 0;
  let sumCostSold = 0;
  let sumRevenue = 0;
  let sumNetProfit = 0;
  let sumTurnover = 0;
  let sumCostTotal = 0;
  let sumProfit = 0;

  productRows.forEach((p, index) => {
    sumJami += p.jami;
    sumQoldi += p.qoldi;
    sumSotildi += p.sotildi;
    sumCostSold += p.olinganNarxiSold;
    sumRevenue += p.sotilganNarx;
    sumNetProfit += p.tozaFoyda;
    sumTurnover += p.abarot;
    sumCostTotal += p.olinganNarxJami;
    sumProfit += p.foyda;

    rows.push(
      csvRow([
        index + 1,
        p.name,
        p.buyPrice,
        p.sellPrice,
        p.jami,
        p.qoldi,
        p.sotildi,
        p.olinganNarxiSold,
        p.sotilganNarx,
        p.tozaFoyda,
        p.abarot,
        p.olinganNarxJami,
        p.foyda,
      ]),
    );
  });

  rows.push(
    csvRow([
      labels.totalRow,
      "",
      "",
      "",
      sumJami,
      sumQoldi,
      sumSotildi,
      sumCostSold,
      sumRevenue,
      sumNetProfit,
      sumTurnover,
      sumCostTotal,
      sumProfit,
    ]),
  );

  rows.push("");
  rows.push(csvRow([dayjs().format("YYYY-MM-DD HH:mm")]));
  return `\uFEFF${rows.join("\n")}`;
}
