import { browserApi } from "../shared/browser-api.js";
import { ACTIVITY_TYPES } from "../shared/constants.js";
import { recordTabActivity } from "../shared/recent-activity.js";

browserApi.runtime.onInstalled.addListener(() => {
  if (browserApi.sidePanel?.setPanelBehavior) {
    browserApi.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }
});

const tabCache = new Map();

async function rememberTab(tab) {
  if (tab?.id !== undefined) {
    tabCache.set(tab.id, tab);
  }
}

browserApi.tabs.onCreated.addListener(async (tab) => {
  await rememberTab(tab);
  await recordTabActivity(browserApi.storage.local, ACTIVITY_TYPES.opened, tab);
});

browserApi.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  await rememberTab(tab);
  if (changeInfo.url || changeInfo.title || changeInfo.status === "complete") {
    await recordTabActivity(browserApi.storage.local, ACTIVITY_TYPES.opened, tab);
  }
});

browserApi.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browserApi.tabs.get(tabId);
  await rememberTab(tab);
  await recordTabActivity(browserApi.storage.local, ACTIVITY_TYPES.activated, tab);
});

browserApi.tabs.onRemoved.addListener(async (tabId) => {
  const tab = tabCache.get(tabId);
  tabCache.delete(tabId);
  await recordTabActivity(browserApi.storage.local, ACTIVITY_TYPES.closed, tab);
});
