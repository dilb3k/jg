import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import dayjs from "dayjs";

const SAF_URI_KEY = "@hisvex_saf_uri";

function getDefaultDir(): string {
  const dir = FileSystem.documentDirectory;
  if (!dir) throw new Error("Document directory unavailable");
  return `${dir}Hisvex/`;
}

async function ensureDefaultDir(): Promise<string> {
  const dir = getDefaultDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

async function saveToHisvexDocs(
  content: string,
  safeName: string,
): Promise<string> {
  const fallback = await ensureDefaultDir();
  const internalPath = `${fallback}${safeName}`;
  await FileSystem.writeAsStringAsync(internalPath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // On Android, try external storage via SAF (one-time dialog)
  if (Platform.OS === "android") {
    try {
      let safUri = await AsyncStorage.getItem(SAF_URI_KEY);
      if (!safUri) {
        const result =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (result.granted && result.directoryUri) {
          safUri = result.directoryUri;
          await AsyncStorage.setItem(SAF_URI_KEY, safUri);
        }
      }
      if (safUri) {
        const fileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            safUri,
            safeName.replace(/\.[^.]+$/, ""),
            "text/csv",
          );
        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          fileUri,
          content,
          {
            encoding: FileSystem.EncodingType.UTF8,
          },
        );
      }
    } catch {}
  }

  return internalPath;
}

export async function shareStatisticsFile(
  content: string,
  filenameBase = "hisvex-statistics",
  format: "csv" | "txt" = "csv",
): Promise<string> {
  const ext = format === "csv" ? "csv" : "txt";
  const safeName = `${filenameBase}-${dayjs().format("YYYY-MM-DD_HH-mm")}.${ext}`;
  const fullPath = await saveToHisvexDocs(content, safeName);
  return fullPath;
}
