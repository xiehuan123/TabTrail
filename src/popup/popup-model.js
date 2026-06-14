import { LIMITS } from "../shared/constants.js";
import { readPreferences } from "../shared/preferences.js";
import {
  getRecentActiveTabs,
  getRecentClosedTabs,
  toTabSnapshot
} from "../shared/recent-activity.js";

export function getPinnedKey(tab) {
  return `url:${tab.url}`;
}

function sortPinnedFirst(items, pinnedKeys) {
  const pins = new Set(pinnedKeys);
  return [...items].sort((a, b) => {
    const aPinned = pins.has(getPinnedKey(a.tab));
    const bPinned = pins.has(getPinnedKey(b.tab));
    if (aPinned === bPinned) {
      return b.timestamp - a.timestamp;
    }
    return aPinned ? -1 : 1;
  });
}

export async function buildPopupState({
  local,
  sync,
  openTabs,
  activeLimit = LIMITS.popupRecentActive,
  closedLimit = LIMITS.popupRecentClosed
}) {
  const preferences = await readPreferences(sync);
  const recentActive = await getRecentActiveTabs(local, openTabs, activeLimit);
  const recentClosed = await getRecentClosedTabs(local, closedLimit);

  return {
    recentActive: sortPinnedFirst(recentActive, preferences.pinnedKeys).slice(0, activeLimit),
    recentClosed
  };
}

export async function queryOpenTabSnapshots(tabsApi) {
  const tabs = await tabsApi.query({});
  return tabs.map(toTabSnapshot);
}

export async function activateOpenTab({ tabsApi, windowsApi }, tab) {
  if (Number.isInteger(tab.windowId)) {
    await windowsApi.update(tab.windowId, { focused: true });
  }
  await tabsApi.update(tab.tabId, { active: true });
}

export async function reopenClosedTab({ tabsApi }, tab) {
  await tabsApi.create({ url: tab.url });
}
