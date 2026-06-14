import { ACTIVITY_TYPES, LIMITS, STORAGE_KEYS } from "./constants.js";

export function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "";
  }
}

export function toTabSnapshot(tab) {
  return {
    tabId: tab.id ?? tab.tabId,
    windowId: tab.windowId,
    title: tab.title || tab.url || "未命名标签",
    url: tab.url || "",
    domain: getDomain(tab.url || ""),
    pinned: Boolean(tab.pinned)
  };
}

export function createActivity(type, { tab, timestamp = Date.now() }) {
  const snapshot = toTabSnapshot(tab);
  return {
    id: `${timestamp}:${type}:${snapshot.windowId ?? "w"}:${snapshot.tabId ?? "t"}:${Math.random().toString(36).slice(2)}`,
    type,
    timestamp,
    tab: snapshot
  };
}

async function readActivities(localArea) {
  const result = await localArea.get(STORAGE_KEYS.activity);
  const activities = result?.[STORAGE_KEYS.activity];
  return Array.isArray(activities) ? activities : [];
}

async function writeActivities(localArea, activities) {
  await localArea.set({ [STORAGE_KEYS.activity]: activities });
}

export async function appendActivity(localArea, activity) {
  const activities = await readActivities(localArea);
  const next = [...activities, activity].slice(-LIMITS.recentActivity);
  await writeActivities(localArea, next);
  return next;
}

export async function getRecentClosedTabs(localArea, limit = LIMITS.popupRecentClosed) {
  const activities = await readActivities(localArea);
  return activities
    .filter((activity) => activity.type === ACTIVITY_TYPES.closed)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export async function getRecentActiveTabs(
  localArea,
  openTabs,
  limit = LIMITS.popupRecentActive
) {
  const openById = new Map(
    openTabs
      .filter((tab) => Number.isInteger(tab.tabId))
      .map((tab) => [tab.tabId, tab])
  );
  const seen = new Set();
  const activities = await readActivities(localArea);
  const result = [];

  for (const activity of [...activities].sort((a, b) => b.timestamp - a.timestamp)) {
    const tabId = activity.tab?.tabId;
    if (activity.type === ACTIVITY_TYPES.closed || !openById.has(tabId) || seen.has(tabId)) {
      continue;
    }

    seen.add(tabId);
    result.push({
      ...activity,
      tab: openById.get(tabId)
    });

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

export async function clearClosedActivities(localArea) {
  const activities = await readActivities(localArea);
  const next = activities.filter((activity) => activity.type !== ACTIVITY_TYPES.closed);
  await writeActivities(localArea, next);
  return next;
}

export async function recordTabActivity(localArea, type, tab, timestamp = Date.now()) {
  if (!tab || !tab.url) {
    return null;
  }

  const activity = createActivity(type, { tab, timestamp });
  await appendActivity(localArea, activity);
  return activity;
}
