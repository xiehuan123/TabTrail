import { STORAGE_KEYS } from "../shared/constants.js";
import { readPreferences } from "../shared/preferences.js";
import { clearClosedActivities, getRecentClosedTabs } from "../shared/recent-activity.js";

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
  const visibleTabs = filterTabs(selectedTabs, query);
  const closedActivities = await getRecentClosedTabs(local);
  const manualGroups = groupManualCategories(visibleTabs, preferences.manualCategories);
  const domainGroups = groupTabsByDomain(visibleTabs);
  const recentlyClosed = createRecentlyClosedGroup(closedActivities);

  return {
    scope,
    query,
    visibleTabs,
    groups: [...manualGroups, ...domainGroups, recentlyClosed],
    preferences
  };
}

export async function assignManualCategory(syncArea, preferences, tab, category) {
  const next = {
    ...preferences,
    manualCategories: {
      ...preferences.manualCategories,
      [getTabKey(tab)]: category
    }
  };
  await syncArea.set({ [STORAGE_KEYS.preferences]: next });
  return next;
}

export async function clearRecentlyClosed(localArea) {
  return clearClosedActivities(localArea);
}
