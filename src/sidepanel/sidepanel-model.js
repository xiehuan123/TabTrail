import { LIMITS, STORAGE_KEYS } from "../shared/constants.js";
import { readPreferences } from "../shared/preferences.js";
import { clearClosedActivities, getRecentClosedTabs } from "../shared/recent-activity.js";
import { getPinnedKey } from "../popup/popup-model.js";

export const SCOPES = Object.freeze({
  currentWindow: "current-window",
  allWindows: "all-windows"
});

export function getTabKey(tab) {
  return `tab:${tab.tabId}`;
}

export function selectTabsByScope(tabs, scope, currentWindowId) {
  if (scope === SCOPES.allWindows) {
    return tabs;
  }
  return tabs.filter((tab) => tab.windowId === currentWindowId);
}

export function filterTabs(tabs, query = "") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return tabs;
  }

  return tabs.filter((tab) => {
    const haystack = [
      tab.title,
      tab.url,
      tab.domain
    ].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

export function sortPinnedFirst(tabs, pinnedKeys) {
  const pins = new Set(pinnedKeys);
  return [...tabs].sort((a, b) => {
    const aPinned = pins.has(getPinnedKey(a));
    const bPinned = pins.has(getPinnedKey(b));
    if (aPinned === bPinned) {
      return 0;
    }
    return aPinned ? -1 : 1;
  });
}

export function groupTabsByDomain(tabs) {
  const byDomain = new Map();
  for (const tab of tabs) {
    const domain = tab.domain || "未知网站";
    if (!byDomain.has(domain)) {
      byDomain.set(domain, []);
    }
    byDomain.get(domain).push(tab);
  }

  return [...byDomain.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, groupedTabs]) => ({
      id: `domain:${domain}`,
      title: domain,
      kind: "domain",
      readOnly: false,
      tabs: groupedTabs
    }));
}

export function groupManualCategories(tabs, manualCategories) {
  const openByKey = new Map(tabs.map((tab) => [getTabKey(tab), tab]));
  const categories = new Map();

  for (const [tabKey, category] of Object.entries(manualCategories)) {
    const tab = openByKey.get(tabKey);
    if (!tab || !category) {
      continue;
    }
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push(tab);
  }

  return [...categories.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupedTabs]) => ({
      id: `manual:${category}`,
      title: category,
      kind: "manual",
      readOnly: false,
      tabs: groupedTabs
    }));
}

export function createRecentlyClosedGroup(closedActivities) {
  return {
    id: "system:recently-closed",
    title: "最近关闭",
    kind: "system",
    readOnly: true,
    tabs: closedActivities.map((activity) => activity.tab)
  };
}

export function reorderPreviewTabs(tabs, tabId, targetIndex) {
  const currentIndex = tabs.findIndex((tab) => tab.tabId === tabId);
  if (currentIndex < 0) {
    return tabs;
  }

  const boundedIndex = Math.max(0, Math.min(targetIndex, tabs.length - 1));
  const next = [...tabs];
  const [moved] = next.splice(currentIndex, 1);
  next.splice(boundedIndex, 0, moved);
  return next;
}

export async function applyPreviewOrderToTabStrip(tabsApi, orderedTabs) {
  const indexesByWindow = new Map();
  for (const tab of orderedTabs) {
    const windowId = tab.windowId;
    const index = indexesByWindow.get(windowId) ?? 0;
    indexesByWindow.set(windowId, index + 1);
    await tabsApi.move(tab.tabId, { index, windowId });
  }
}

export async function activateTabFromPanel({ tabsApi, windowsApi }, tab) {
  if (Number.isInteger(tab.windowId)) {
    await windowsApi.update(tab.windowId, { focused: true });
  }
  await tabsApi.update(tab.tabId, { active: true });
}

export async function reopenRecentlyClosedFromPanel({ tabsApi }, tab) {
  await tabsApi.create({ url: tab.url });
}

export async function closeSelectedTabs({ tabsApi, confirm = async () => true }, tabIds) {
  const count = tabIds.length;
  if (count === 0) {
    return { closed: false, confirmed: false, count };
  }

  let confirmed = false;
  if (count >= LIMITS.bulkCloseConfirmThreshold) {
    confirmed = await confirm(count);
    if (!confirmed) {
      return { closed: false, confirmed: false, count };
    }
  }

  await tabsApi.remove(tabIds);
  return { closed: true, confirmed, count };
}

export async function togglePinnedPreference(syncArea, preferences, tab) {
  const key = getPinnedKey(tab);
  const pinned = new Set(preferences.pinnedKeys);
  if (pinned.has(key)) {
    pinned.delete(key);
  } else {
    pinned.add(key);
  }

  const next = {
    ...preferences,
    pinnedKeys: [...pinned]
  };
  await syncArea.set({ [STORAGE_KEYS.preferences]: next });
  return next;
}

export async function buildSidePanelState({
  local,
  sync,
  tabs,
  currentWindowId,
  scope = SCOPES.currentWindow,
  query = ""
}) {
  const preferences = await readPreferences(sync);
  const selectedTabs = selectTabsByScope(tabs, scope, currentWindowId);
  const visibleTabs = sortPinnedFirst(filterTabs(selectedTabs, query), preferences.pinnedKeys);
  const closedActivities = await getRecentClosedTabs(local);
  const manualGroups = groupManualCategories(visibleTabs, preferences.manualCategories);
  const domainGroups = groupTabsByDomain(visibleTabs);
  const recentlyClosed = createRecentlyClosedGroup(closedActivities);

  return {
    scope,
    query,
    visibleTabs,
    groups: [...manualGroups, ...domainGroups, recentlyClosed],
    preferences,
    actions: {
      togglePinned: (tab) => togglePinnedPreference(sync, preferences, tab)
    }
  };
}

export async function assignManualCategory(syncArea, preferences, tab, category) {
  if (!Number.isInteger(tab?.tabId)) {
    throw new Error("Only open tabs can be manually categorized");
  }

  const normalizedCategory = category.trim();
  if (!normalizedCategory) {
    throw new Error("Category name is required");
  }

  const next = {
    ...preferences,
    manualCategories: {
      ...preferences.manualCategories,
      [getTabKey(tab)]: normalizedCategory
    }
  };
  await syncArea.set({ [STORAGE_KEYS.preferences]: next });
  return next;
}

export async function assignCategoryToTabs(syncArea, preferences, tabs, category) {
  const normalizedCategory = category.trim();
  if (!normalizedCategory) {
    throw new Error("Category name is required");
  }

  const nextManualCategories = { ...preferences.manualCategories };
  for (const tab of tabs) {
    if (!Number.isInteger(tab?.tabId)) {
      throw new Error("Only open tabs can be manually categorized");
    }
    nextManualCategories[getTabKey(tab)] = normalizedCategory;
  }

  const next = {
    ...preferences,
    manualCategories: nextManualCategories
  };
  await syncArea.set({ [STORAGE_KEYS.preferences]: next });
  return next;
}

export async function clearRecentlyClosed(localArea) {
  return clearClosedActivities(localArea);
}
