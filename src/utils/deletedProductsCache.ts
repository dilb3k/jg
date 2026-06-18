const deletedNames = new Map<string, string>();
const DELETED_NAMES_KEY = "deleted_product_names";

let loaded = false;
let loadPromise: Promise<void> | null = null;

const loadFromStorage = async () => {
  if (loaded) return;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const { getItemAsync } = await import("./secureStorage");
      const raw = await getItemAsync(DELETED_NAMES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        for (const [id, name] of Object.entries(parsed)) {
          deletedNames.set(id, name);
        }
      }
    } catch {
    }
    loaded = true;
  })();
  return loadPromise;
};

const persistToStorage = async () => {
  try {
    const { setItemAsync } = await import("./secureStorage");
    const obj: Record<string, string> = {};
    deletedNames.forEach((name, id) => { obj[id] = name; });
    await setItemAsync(DELETED_NAMES_KEY, JSON.stringify(obj));
  } catch {
  }
};

export const initDeletedProductsCache = loadFromStorage;

export const saveDeletedProductName = async (id: string, name: string) => {
  deletedNames.set(id, name);
  await persistToStorage();
};

export const getDeletedProductName = async (id: string): Promise<string | null> => {
  await loadFromStorage();
  return deletedNames.get(id) ?? null;
};

export const getDeletedProductNameSync = (id: string): string | null => {
  return deletedNames.get(id) ?? null;
};
