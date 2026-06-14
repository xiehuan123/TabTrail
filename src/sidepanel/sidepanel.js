import { browserApi } from "../shared/browser-api.js";
import { toTabSnapshot } from "../shared/recent-activity.js";
import {
  activateTabFromPanel,
  applyPreviewOrderToTabStrip,
  assignCategoryToTabs,
  buildSidePanelState,
  clearRecentlyClosed,
  closeSelectedTabs,
  reorderPreviewTabs,
  reopenRecentlyClosedFromPanel,
  SCOPES
} from "./sidepanel-model.js";

const groups = document.querySelector("#tab-groups");
const actions = document.querySelector("#panel-actions");
const recentActiveList = document.querySelector("#recent-active-list");
const recentClosedList = document.querySelector("#recent-closed-list");
const summaryOpenTabs = document.querySelector("#summary-open-tabs");
const summaryVisibleTabs = document.querySelector("#summary-visible-tabs");
const summaryRecentClosed = document.querySelector("#summary-recent-closed");
const search = document.querySelector("#tab-search");
const categoryName = document.querySelector("#category-name");
const assignCategoryButton = document.querySelector("#assign-category");
const buttons = [...document.querySelectorAll(".scope-button")];
let scope = SCOPES.currentWindow;
let currentWindowId = null;
let latestState = null;
let previewTabs = [];
let draggedTabId = null;
const selectedTabIds = new Set();

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    scope = button.dataset.scope;
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

search.addEventListener("input", () => render());

assignCategoryButton.addEventListener("click", async () => {
  const selected = previewTabs.filter((tab) => selectedTabIds.has(tab.tabId));
  if (selected.length === 0 || !categoryName.value.trim()) {
    return;
  }

  await assignCategoryToTabs(
    browserApi.storage.sync,
    latestState.preferences,
    selected,
    categoryName.value
  );
  selectedTabIds.clear();
  await render();
});

function syncActionState() {
  assignCategoryButton.disabled = selectedTabIds.size === 0 || !categoryName.value.trim();
}

categoryName.addEventListener("input", syncActionState);

function renderEmpty(text) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = text;
  groups.replaceChildren(empty);
}

function renderStructuredEmpty(emptyState) {
  const empty = document.createElement("div");
  empty.className = "empty-state empty-state-panel";

  const title = document.createElement("strong");
  title.textContent = emptyState.title;

  const description = document.createElement("span");
  description.textContent = emptyState.description;

  empty.append(title, description);

  if (emptyState.actionLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.textContent = emptyState.actionLabel;
    button.addEventListener("click", () => {
      search.value = "";
      render();
    });
    empty.append(button);
  }

  groups.replaceChildren(empty);
}

function createTabRow(tab, index, group) {
  const item = document.createElement("li");
  item.className = "tab-item";
  item.draggable = !group.readOnly;
  item.dataset.tabId = String(tab.tabId);
  item.addEventListener("dragstart", (event) => {
    if (group.readOnly) {
      event.preventDefault();
      return;
    }
    draggedTabId = tab.tabId;
    event.dataTransfer.effectAllowed = "move";
  });
  item.addEventListener("dragover", (event) => {
    if (!group.readOnly && draggedTabId !== null) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  });
  item.addEventListener("drop", (event) => {
    event.preventDefault();
    if (group.readOnly || draggedTabId === null) {
      return;
    }
    const targetIndex = previewTabs.findIndex((itemTab) => itemTab.tabId === tab.tabId);
    previewTabs = reorderPreviewTabs(previewTabs, draggedTabId, targetIndex);
    draggedTabId = null;
    renderGroups({ ...latestState, visibleTabs: previewTabs, groups: latestState.groups });
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "tab-select";
  checkbox.checked = selectedTabIds.has(tab.tabId);
  checkbox.disabled = group.readOnly;
  checkbox.setAttribute("aria-label", `选择 ${tab.title}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      selectedTabIds.add(tab.tabId);
    } else {
      selectedTabIds.delete(tab.tabId);
    }
    syncActionState();
    renderGroups({ ...latestState, visibleTabs: previewTabs, groups: latestState.groups });
  });

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "tab-open";
  openButton.title = group.readOnly ? "重新打开此标签" : "切换到此标签";
  openButton.addEventListener("click", async () => {
    if (group.id === "system:recently-closed") {
      await reopenRecentlyClosedFromPanel({ tabsApi: browserApi.tabs }, tab);
      return;
    }
    await activateTabFromPanel({
      tabsApi: browserApi.tabs,
      windowsApi: browserApi.windows
    }, tab);
  });

  const title = document.createElement("span");
  title.className = "tab-title";
  title.textContent = tab.title;

  const domain = document.createElement("span");
  domain.className = "tab-domain";
  domain.textContent = tab.domain || tab.url;

  const time = document.createElement("span");
  time.className = "tab-time";
  time.textContent = tab.timeText || "";
  if (tab.fullTimeText) {
    time.title = tab.fullTimeText;
  }

  const pinButton = document.createElement("button");
  pinButton.type = "button";
  pinButton.className = "icon-button";
  pinButton.textContent = latestState.preferences.pinnedKeys.includes(`url:${tab.url}`) ? "★" : "☆";
  pinButton.title = "固定到 TabTrail";
  pinButton.disabled = group.readOnly;
  pinButton.addEventListener("click", async () => {
    await latestState.actions.togglePinned(tab);
    await render();
  });

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "icon-button";
  upButton.textContent = "↑";
  upButton.title = "上移";
  upButton.disabled = group.readOnly || index === 0;
  upButton.addEventListener("click", () => {
    previewTabs = reorderPreviewTabs(previewTabs, tab.tabId, Math.max(0, index - 1));
    renderGroups({ ...latestState, visibleTabs: previewTabs, groups: latestState.groups });
  });

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "icon-button";
  downButton.textContent = "↓";
  downButton.title = "下移";
  downButton.disabled = group.readOnly || index >= previewTabs.length - 1;
  downButton.addEventListener("click", () => {
    previewTabs = reorderPreviewTabs(previewTabs, tab.tabId, Math.min(previewTabs.length - 1, index + 1));
    renderGroups({ ...latestState, visibleTabs: previewTabs, groups: latestState.groups });
  });

  const details = document.createElement("span");
  details.className = "tab-details";
  details.append(title, domain);
  if (time.textContent) {
    details.append(time);
  }
  openButton.append(details);

  item.append(checkbox, openButton, pinButton, upButton, downButton);
  return item;
}

function renderGroups(state) {
  const visibleGroups = state.groups.filter((group) => {
    return group.tabs.length > 0 || group.id === "system:recently-closed";
  });

  if (state.emptyState.reason) {
    actions.replaceChildren();
    renderStructuredEmpty(state.emptyState);
    return;
  }
  if (visibleGroups.length === 0) {
    actions.replaceChildren();
    renderEmpty("没有匹配的标签");
    return;
  }

  const applyButton = document.createElement("button");
  applyButton.type = "button";
  applyButton.className = "text-button";
  applyButton.textContent = "应用到标签栏";
  applyButton.addEventListener("click", async () => {
    await applyPreviewOrderToTabStrip(browserApi.tabs, previewTabs);
    await render();
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "text-button";
  closeButton.textContent = `关闭已选 (${selectedTabIds.size})`;
  closeButton.disabled = selectedTabIds.size === 0;
  closeButton.addEventListener("click", async () => {
    const selected = [...selectedTabIds];
    const result = await closeSelectedTabs({
      tabsApi: browserApi.tabs,
      confirm: async (count) => globalThis.confirm(`确定关闭 ${count} 个标签？`)
    }, selected);
    if (result.closed) {
      selectedTabIds.clear();
      await render();
    }
  });

  actions.replaceChildren(applyButton, closeButton);
  syncActionState();

  groups.replaceChildren(...visibleGroups.map((group) => {
    const section = document.createElement("section");
    section.className = `tab-group tab-group-${group.kind}`;
    section.dataset.groupId = group.id;
    if (group.readOnly) {
      section.dataset.readOnly = "true";
    }

    const header = document.createElement("div");
    header.className = "tab-group-header";

    const title = document.createElement("h2");
    title.textContent = `${group.title} (${group.tabs.length})`;
    header.append(title);

    if (group.id === "system:recently-closed" && group.tabs.length > 0) {
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "text-button";
      clearButton.textContent = "清空";
      clearButton.addEventListener("click", async () => {
        await clearRecentlyClosed(browserApi.storage.local);
        await render();
      });
      header.append(clearButton);
    }

    const list = document.createElement("ul");
    list.className = "tab-list";
    const sourceTabs = group.kind === "domain" ? previewTabs.filter((tab) => {
      return group.tabs.some((groupTab) => groupTab.tabId === tab.tabId);
    }) : group.tabs;
    list.replaceChildren(...sourceTabs.map((tab, index) => createTabRow(tab, index, group)));

    section.append(header, list);
    return section;
  }));
}

function renderSummary(summary) {
  summaryOpenTabs.textContent = String(summary.openTabCount);
  summaryVisibleTabs.textContent = String(summary.visibleTabCount);
  summaryRecentClosed.textContent = String(summary.recentClosedCount);
  summaryOpenTabs.title = summary.scopeLabel;
}

function renderCompactList(list, items, emptyText, onClick) {
  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = emptyText;
    list.replaceChildren(empty);
    return;
  }

  list.replaceChildren(...items.slice(0, 4).map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "compact-row";
    button.addEventListener("click", () => onClick(item.tab));

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = item.tab.title;

    const meta = document.createElement("span");
    meta.className = "compact-meta";

    const domain = document.createElement("span");
    domain.className = "tab-domain";
    domain.textContent = item.tab.domain || item.tab.url;

    const time = document.createElement("span");
    time.className = "tab-time";
    time.textContent = item.timeText;
    time.title = item.fullTimeText;

    meta.append(domain, time);
    button.append(title, meta);

    const listItem = document.createElement("li");
    listItem.append(button);
    return listItem;
  }));
}

function renderRecentPanels(state) {
  renderCompactList(recentActiveList, state.recentActive, "还没有最近活跃标签", (tab) => {
    activateTabFromPanel({
      tabsApi: browserApi.tabs,
      windowsApi: browserApi.windows
    }, tab);
  });
  renderCompactList(recentClosedList, state.recentClosed, "最近关闭为空", (tab) => {
    reopenRecentlyClosedFromPanel({ tabsApi: browserApi.tabs }, tab);
  });
}

async function getOpenTabs() {
  const tabs = await browserApi.tabs.query({});
  return tabs.map(toTabSnapshot);
}

async function render() {
  const tabs = await getOpenTabs();
  latestState = await buildSidePanelState({
    local: browserApi.storage.local,
    sync: browserApi.storage.sync,
    tabs,
    currentWindowId,
    scope,
    query: search.value
  });
  previewTabs = latestState.visibleTabs;
  renderSummary(latestState.summary);
  renderRecentPanels(latestState);
  renderGroups(latestState);
  syncActionState();
}

async function init() {
  const currentWindow = await browserApi.windows.getCurrent();
  currentWindowId = currentWindow.id;
  await render();
}

init().catch((error) => {
  console.error(error);
  renderEmpty("无法读取标签数据");
});
