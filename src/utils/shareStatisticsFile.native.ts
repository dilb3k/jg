import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import dayjs from "dayjs";

const EXPORT_DIR_KEY = "hisvex_export_directory_uri";

async function saveToAndroidDownloads(
  content: string,
  safeName: string,
  mime: string,
): Promise<string> {
  const { StorageAccessFramework } = FileSystem;
  let dirUri = await AsyncStorage.getItem(EXPORT_DIR_KEY);

  if (!dirUri) {
    const downloadsUri = StorageAccessFramework.getUriForDirectoryInRoot("Download");
    const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync(
      downloadsUri,
    );
    if (!permission.granted) {
      throw new Error("Download folder access denied");
    }
    dirUri = permission.directoryUri;
    await AsyncStorage.setItem(EXPORT_DIR_KEY, dirUri);
  }

  const baseName = safeName.replace(/\.[^/.]+$/, "");
  const fileUri = await StorageAccessFramework.createFileAsync(dirUri, baseName, mime);
  await StorageAccessFramework.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return safeName;
}

async function saveToAppDocuments(content: string, safeName: string): Promise<string> {
  const dir = FileSystem.documentDirectory;
  if (!dir) {
    throw new Error("Document directory unavailable");
  }
  const path = `${dir}${safeName}`;
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return safeName;
}

export async function shareStatisticsFile(
  content: string,
  filenameBase = "hisvex-statistics",
  format: "csv" | "txt" = "csv",
): Promise<string> {
  const ext = format === "csv" ? "csv" : "txt";
  const mime = format === "csv" ? "text/csv" : "text/plain";
  const safeName = `${filenameBase}-${dayjs().format("YYYY-MM-DD_HH-mm")}.${ext}`;

  if (Platform.OS === "android") {
    try {
      return await saveToAndroidDownloads(content, safeName, mime);
    } catch {
      return saveToAppDocuments(content, safeName);
    }
  }

  return saveToAppDocuments(content, safeName);
}
