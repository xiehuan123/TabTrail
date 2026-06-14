import { STORAGE_KEYS } from "./constants.js";

export const DEFAULT_PREFERENCES = Object.freeze({
  manualCategories: {},
  pinnedKeys: [],
  previewOrders: {},
  defaultScope: "current-window"
});

function normalizePreferences(value) {
  return {
    manualCategories: value?.manualCategories && typeof value.manualCategories === "object"
      ? value.manualCategories
      : DEFAULT_PREFERENCES.manualCategories,
    pinnedKeys: Array.isArray(value?.pinnedKeys)
      ? value.pinnedKeys
      : DEFAULT_PREFERENCES.pinnedKeys,
    previewOrders: value?.previewOrders && typeof value.previewOrders === "object"
      ? value.previewOrders
      : DEFAULT_PREFERENCES.previewOrders,
    defaultScope: value?.defaultScope === "all-windows"
      ? "all-windows"
      : DEFAULT_PREFERENCES.defaultScope
  };
}

export async function readPreferences(syncArea) {
  const result = await syncArea.get(STORAGE_KEYS.preferences);
  return normalizePreferences(result?.[STORAGE_KEYS.preferences]);
}

export async function savePreferences(syncArea, preferences) {
  const normalized = normalizePreferences(preferences);
  try {
    await syncArea.set({ [STORAGE_KEYS.preferences]: normalized });
    return { ok: true, preferences: normalized };
  } catch (error) {
    return { ok: false, preferences: normalized, error };
  }
}

export async function readActivities(localArea) {
  const result = await localArea.get(STORAGE_KEYS.activity);
  const activities = result?.[STORAGE_KEYS.activity];
  return Array.isArray(activities) ? activities : [];
}

export async function getTabTrailState({ local, sync }) {
  const [activities, preferences] = await Promise.all([
    readActivities(local),
    readPreferences(sync)
  ]);

  return { activities, preferences };
}
