import { ACTIVITY_TYPES } from "../shared/constants.js";
import { recordTabActivity } from "../shared/recent-activity.js";

async function findRecentlyClosedTab(sessionsApi, tabId) {
  if (!sessionsApi?.getRecentlyClosed) {
    return null;
  }

  const sessions = await sessionsApi.getRecentlyClosed({ maxResults: 10 });
  const tabSession = sessions.find((session) => {
    return session.tab && (!Number.isInteger(tabId) || session.tab.id === tabId);
  });
  return tabSession?.tab ?? sessions.find((session) => session.tab)?.tab ?? null;
}

export async function handleTabRemoved({
  tabId,
  tabCache,
  localArea,
  sessionsApi
}) {
  const cachedTab = tabCache.get(tabId);
  tabCache.delete(tabId);

  const tab = cachedTab ?? await findRecentlyClosedTab(sessionsApi, tabId);
  return recordTabActivity(localArea, ACTIVITY_TYPES.closed, tab);
}
