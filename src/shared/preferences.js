import { STORAGE_KEYS } from "./constants.js";

export const DEFAULT_PREFERENCES = Object.freeze({
  manualCategories: {},
  pinnedKeys: [],
  previewOrders: {},
  defaultScope: "current-window",
  actionClickBehavior: "popup",
  onboarding: {
    firstInstallGuideStatus: "completed",
    firstInstallGuideVersion: 1,
    firstInstallGuideSeenAt: null
  }
});

const ONBOARDING_STATUSES = new Set(["pending", "completed", "skipped"]);

function normalizeOnboarding(value) {
  const status = ONBOARDING_STATUSES.has(value?.firstInstallGuideStatus)
    ? value.firstInstallGuideStatus
    : DEFAULT_PREFERENCES.onboarding.firstInstallGuideStatus;
  const version = Number.isInteger(value?.firstInstallGuideVersion)
    ? value.firstInstallGuideVersion
    : DEFAULT_PREFERENCES.onboarding.firstInstallGuideVersion;
  const seenAt = Number.isFinite(value?.firstInstallGuideSeenAt)
    ? value.firstInstallGuideSeenAt
    : DEFAULT_PREFERENCES.onboarding.firstInstallGuideSeenAt;

  return {
    firstInstallGuideStatus: status,
    firstInstallGuideVersion: version,
    firstInstallGuideSeenAt: seenAt
  };
}

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
      : DEFAULT_PREFERENCES.defaultScope,
    actionClickBehavior: value?.actionClickBehavior === "side-panel"
      ? "side-panel"
      : DEFAULT_PREFERENCES.actionClickBehavior,
    onboarding: normalizeOnboarding(value?.onboarding)
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

async function updateOnboardingStatus(syncArea, status, seenAt) {
  const preferences = await readPreferences(syncArea);
  const next = {
    ...preferences,
    onboarding: {
      ...preferences.onboarding,
      firstInstallGuideStatus: status,
      firstInstallGuideVersion: 1,
      firstInstallGuideSeenAt: Number.isFinite(seenAt)
        ? seenAt
        : preferences.onboarding.firstInstallGuideSeenAt
    }
  };

  return savePreferences(syncArea, next);
}

export async function markOnboardingPending(syncArea, seenAt = Date.now()) {
  return updateOnboardingStatus(syncArea, "pending", seenAt);
}

export async function markOnboardingCompleted(syncArea) {
  return updateOnboardingStatus(syncArea, "completed");
}

export async function markOnboardingSkipped(syncArea) {
  return updateOnboardingStatus(syncArea, "skipped");
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
