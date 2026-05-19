import dayjs from "dayjs";

export async function shareStatisticsFile(
  content: string,
  filenameBase = "hisvex-statistics",
  format: "csv" | "txt" = "csv",
): Promise<string> {
  const ext = format === "csv" ? "csv" : "txt";
  const mime = format === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8";
  const safeName = `${filenameBase}-${dayjs().format("YYYY-MM-DD_HH-mm")}.${ext}`;
  const blob = new Blob([content], { type: mime });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return safeName;
}
