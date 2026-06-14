import { LIMITS } from "../shared/constants.js";
import { readPreferences, savePreferences } from "../shared/preferences.js";
import { formatRelativeTime, getFullTimeText } from "../shared/time-format.js";
import {
  getRecentActiveTabs,
  getRecentClosedTabs,
  toTabSnapshot
} from "../shared/recent-activity.js";

const SIDE_PANEL_UNSUPPORTED_MESSAGE = "当前浏览器不支持自动打开侧边栏，请从扩展菜单中手动打开 TabTrail。";

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
  closedLimit = LIMITS.popupRecentClosed,
  now = Date.now()
}) {
  const preferences = await readPreferences(sync);
  const recentActive = await getRecentActiveTabs(local, openTabs, activeLimit);
  const recentClosed = await getRecentClosedTabs(local, closedLimit);
  const activeItems = sortPinnedFirst(recentActive, preferences.pinnedKeys)
    .slice(0, activeLimit)
    .map((item) => withTimeContext(item, now));
  const closedItems = recentClosed
    .slice(0, closedLimit)
    .map((item) => withTimeContext(item, now));

  return {
    recentActive: activeItems,
    recentClosed: closedItems,
    preferences,
    summary: {
      openTabCount: openTabs.length,
      recentActiveCount: activeItems.length,
      recentClosedCount: closedItems.length
    }
  };
}

function withTimeContext(item, now) {
  return {
    ...item,
    timeText: formatRelativeTime(item.timestamp, now),
    fullTimeText: getFullTimeText(item.timestamp)
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

export function getSidePanelOpenState({ sidePanelApi }) {
  const supported = typeof sidePanelApi?.open === "function";
  return {
    supported,
    message: supported ? "可以自动打开侧边栏" : SIDE_PANEL_UNSUPPORTED_MESSAGE
  };
}

export async function openTabTrailSidePanel({ sidePanelApi }, windowId) {
  if (typeof sidePanelApi?.open !== "function") {
    return {
      ok: false,
      reason: "unsupported",
      message: SIDE_PANEL_UNSUPPORTED_MESSAGE
    };
  }

  try {
    const options = Number.isInteger(windowId) ? { windowId } : {};
    await sidePanelApi.open(options);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "failed",
      message: "无法自动打开侧边栏，请从扩展菜单中手动打开 TabTrail。",
      error
    };
  }
}

export async function setActionClickBehavior(sync, apis, behavior) {
  const sidePanelApi = apis?.sidePanelApi ?? apis;
  const actionApi = apis?.actionApi;
  const nextBehavior = behavior === "side-panel" ? "side-panel" : "popup";
  const preferences = await readPreferences(sync);
  const nextPreferences = {
    ...preferences,
    actionClickBehavior: nextBehavior
  };

  if (typeof sidePanelApi?.setPanelBehavior === "function") {
    await sidePanelApi.setPanelBehavior({
      openPanelOnActionClick: nextBehavior === "side-panel"
    });
  }
  if (typeof actionApi?.setPopup === "function") {
    await actionApi.setPopup({
      popup: nextBehavior === "side-panel" ? "" : "src/popup/popup.html"
    });
  }

  return savePreferences(sync, nextPreferences);
}
