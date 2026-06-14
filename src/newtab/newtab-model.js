import {
  activateTabFromPanel,
  buildSidePanelState,
  reopenRecentlyClosedFromPanel,
  SCOPES
} from "../sidepanel/sidepanel-model.js";
import { openTabTrailSidePanel } from "../popup/popup-model.js";

export async function buildNewTabDashboardState(options) {
  const state = await buildSidePanelState({
    ...options,
    scope: options.scope || SCOPES.currentWindow
  });

  return {
    ...state,
    surface: "newtab",
    searchHint: "搜索当前打开的标签"
  };
}

export async function activateTabFromDashboard(apis, tab) {
  return activateTabFromPanel(apis, tab);
}

export async function reopenClosedFromDashboard(apis, tab) {
  return reopenRecentlyClosedFromPanel(apis, tab);
}

export async function openDashboardSidePanel({ sidePanelApi }, windowId) {
  return openTabTrailSidePanel({ sidePanelApi }, windowId);
}
