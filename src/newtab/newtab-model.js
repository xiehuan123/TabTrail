import {
  activateTabFromPanel,
  assignManualCategory,
  buildSidePanelState,
  closeSelectedTabs,
  reopenRecentlyClosedFromPanel,
  SCOPES
} from "../sidepanel/sidepanel-model.js";
import { openTabTrailSidePanel } from "../popup/popup-model.js";

const ALL_CATEGORY_ID = "all";

function createAllCategory(visibleTabs) {
  return {
    id: ALL_CATEGORY_ID,
    title: "全部",
    kind: "all",
    readOnly: false,
    canReceiveDrop: false,
    canClose: false,
    count: visibleTabs.length,
    tabs: visibleTabs
  };
}

function toDashboardCategory(group) {
  const canReceiveDrop = group.kind === "manual" && !group.readOnly;
  const canClose = (group.kind === "manual" || group.kind === "domain") && group.tabs.length > 0;
  return {
    ...group,
    canReceiveDrop,
    canClose,
    count: group.tabs.length
  };
}

export function buildDashboardCategories(state) {
  return [
    createAllCategory(state.visibleTabs),
    ...state.groups.map(toDashboardCategory)
  ];
}

export function resolveDashboardCategory(categories, categoryId = ALL_CATEGORY_ID) {
  return categories.find((category) => category.id === categoryId) || categories[0];
}

function getManualCategoryName(categoryId) {
  if (!categoryId?.startsWith("manual:")) {
    throw new Error("Only manual categories can receive dragged tabs");
  }
  const name = categoryId.slice("manual:".length).trim();
  if (!name) {
    throw new Error("Only manual categories can receive dragged tabs");
  }
  return name;
}

export async function buildNewTabDashboardState(options) {
  const state = await buildSidePanelState({
    ...options,
    scope: options.scope || SCOPES.currentWindow
  });
  const categories = buildDashboardCategories(state);
  const currentCategory = resolveDashboardCategory(categories, options.categoryId);

  return {
    ...state,
    surface: "newtab",
    searchHint: "搜索当前打开的标签",
    categories,
    selectedCategoryId: currentCategory.id,
    currentCategory,
    currentCategoryTabs: currentCategory.tabs
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

export async function assignDashboardTabToCategory(syncArea, preferences, tab, categoryId) {
  const categoryName = getManualCategoryName(categoryId);
  return assignManualCategory(syncArea, preferences, tab, categoryName);
}

export async function closeDashboardCategory({ tabsApi, confirm = async () => true }, category) {
  if (!category?.canClose && category?.kind !== "manual" && category?.kind !== "domain") {
    throw new Error("This dashboard category cannot be closed");
  }
  if (category.id === ALL_CATEGORY_ID || category.readOnly || category.kind === "system") {
    throw new Error("This dashboard category cannot be closed");
  }

  const tabIds = category.tabs
    .map((tab) => tab.tabId)
    .filter((tabId) => Number.isInteger(tabId));
  const count = tabIds.length;
  if (count === 0) {
    return { closed: false, confirmed: false, count, tabIds };
  }

  const confirmed = await confirm({ categoryTitle: category.title, count });
  if (!confirmed) {
    return { closed: false, confirmed: false, count, tabIds };
  }

  await closeSelectedTabs({ tabsApi, confirm: async () => true }, tabIds);
  return { closed: true, confirmed: true, count, tabIds };
}
