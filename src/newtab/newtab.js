import { browserApi } from "../shared/browser-api.js";
import { toTabSnapshot } from "../shared/recent-activity.js";
import {
  activateTabFromDashboard,
  buildNewTabDashboardState,
  openDashboardSidePanel,
  reopenClosedFromDashboard
} from "./newtab-model.js";
import {
  applyPreviewOrderToTabStrip,
  closeSelectedTabs,
  reorderPreviewTabs,
  SCOPES
} from "../sidepanel/sidepanel-model.js";

const search = document.querySelector("#dashboard-search");
const openSidePanelButton = document.querySelector("#dashboard-open-side-panel");
const scopeButtons = [...document.querySelectorAll(".scope-button")];
const activeList = document.querySelector("#dashboard-active-list");
const closedList = document.querySelector("#dashboard-closed-list");
const groupsContainer = document.querySelector("#dashboard-groups");
const openCount = document.querySelector("#dashboard-open-count");
const visibleCount = document.querySelector("#dashboard-visible-count");
const closedCount = document.querySelector("#dashboard-closed-count");
const applyOrderButton = document.querySelector("#dashboard-apply-order");
const closeSelectedButton = document.querySelector("#dashboard-close-selected");
const message = document.querySelector("#dashboard-message");

let scope = SCOPES.currentWindow;
let currentWindowId = null;
let latestState = null;
let previewTabs = [];
const selectedTabIds = new Set();

function renderEmpty(container, text) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = text;
  container.replaceChildren(empty);
}

function renderCompactList(container, items, emptyText, onClick) {
  if (items.length === 0) {
    renderEmpty(container, emptyText);
    return;
  }

  container.replaceChildren(...items.slice(0, 6).map((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "compact-row";
    row.addEventListener("click", () => onClick(item.tab));

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = item.tab.title;

    const meta = document.createElement("span");
    meta.className = "tab-meta";

    const domain = document.createElement("span");
    domain.className = "tab-domain";
    domain.textContent = item.tab.domain || item.tab.url;

    const time = document.createElement("span");
    time.className = "tab-time";
    time.textContent = item.timeText;
    time.title = item.fullTimeText;

    meta.append(domain, time);
    row.append(title, meta);

    const listItem = document.createElement("li");
    listItem.append(row);
    return listItem;
  }));
}

function renderSummary(state) {
  openCount.textContent = String(state.summary.openTabCount);
  visibleCount.textContent = String(state.summary.visibleTabCount);
  closedCount.textContent = String(state.summary.recentClosedCount);
}

function createTabRow(tab, group) {
  const item = document.createElement("li");
  item.className = "tab-row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "tab-select";
  checkbox.disabled = group.readOnly;
  checkbox.checked = selectedTabIds.has(tab.tabId);
  checkbox.setAttribute("aria-label", `选择 ${tab.title}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      selectedTabIds.add(tab.tabId);
    } else {
      selectedTabIds.delete(tab.tabId);
    }
    renderActionState();
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "tab-row-inner";
  button.addEventListener("click", () => {
    if (group.readOnly) {
      reopenClosedFromDashboard({ tabsApi: browserApi.tabs }, tab);
      return;
    }
    activateTabFromDashboard({
      tabsApi: browserApi.tabs,
      windowsApi: browserApi.windows
    }, tab);
  });

  const title = document.createElement("span");
  title.className = "tab-title";
  title.textContent = tab.title;

  const meta = document.createElement("span");
  meta.className = "tab-meta";

  const domain = document.createElement("span");
  domain.className = "tab-domain";
  domain.textContent = tab.domain || tab.url;

  meta.append(domain);
  if (tab.timeText) {
    const time = document.createElement("span");
    time.className = "tab-time";
    time.textContent = tab.timeText;
    time.title = tab.fullTimeText || "";
    meta.append(time);
  }

  button.append(title, meta);
  item.append(checkbox, button);
  return item;
}

function renderGroups(state) {
  if (state.emptyState.reason) {
    renderEmpty(groupsContainer, state.emptyState.title);
    return;
  }

  const groups = state.groups.filter((group) => {
    return group.tabs.length > 0 || group.id === "system:recently-closed";
  });

  groupsContainer.replaceChildren(...groups.map((group) => {
    const section = document.createElement("section");
    section.className = "tab-group";
    section.dataset.groupId = group.id;

    const header = document.createElement("div");
    header.className = "tab-group-header";

    const title = document.createElement("h3");
    title.textContent = `${group.title} (${group.tabs.length})`;
    header.append(title);

    const list = document.createElement("ul");
    list.className = "tab-list";
    const sourceTabs = group.kind === "domain"
      ? previewTabs.filter((tab) => group.tabs.some((groupTab) => groupTab.tabId === tab.tabId))
      : group.tabs;
    list.replaceChildren(...sourceTabs.map((tab) => createTabRow(tab, group)));

    section.append(header, list);
    return section;
  }));
}

function renderActionState() {
  closeSelectedButton.textContent = `关闭已选 (${selectedTabIds.size})`;
  closeSelectedButton.disabled = selectedTabIds.size === 0;
  applyOrderButton.disabled = previewTabs.length === 0;
}

async function getOpenTabs() {
  const tabs = await browserApi.tabs.query({});
  return tabs.map(toTabSnapshot);
}

async function render() {
  const tabs = await getOpenTabs();
  latestState = await buildNewTabDashboardState({
    local: browserApi.storage.local,
    sync: browserApi.storage.sync,
    tabs,
    currentWindowId,
    scope,
    query: search.value
  });
  previewTabs = latestState.visibleTabs;
  renderSummary(latestState);
  renderCompactList(activeList, latestState.recentActive, "还没有最近活跃标签", (tab) => {
    activateTabFromDashboard({ tabsApi: browserApi.tabs, windowsApi: browserApi.windows }, tab);
  });
  renderCompactList(closedList, latestState.recentClosed, "最近关闭为空", (tab) => {
    reopenClosedFromDashboard({ tabsApi: browserApi.tabs }, tab);
  });
  renderGroups(latestState);
  renderActionState();
}

scopeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scope = button.dataset.scope;
    scopeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

search.addEventListener("input", () => render());

openSidePanelButton.addEventListener("click", async () => {
  const result = await openDashboardSidePanel({ sidePanelApi: browserApi.sidePanel }, currentWindowId);
  message.textContent = result.ok ? "侧边栏已打开" : result.message;
});

applyOrderButton.addEventListener("click", async () => {
  await applyPreviewOrderToTabStrip(browserApi.tabs, previewTabs);
  await render();
});

closeSelectedButton.addEventListener("click", async () => {
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

async function init() {
  const currentWindow = await browserApi.windows.getCurrent();
  currentWindowId = currentWindow.id;
  await render();
}

init().catch((error) => {
  console.error(error);
  message.textContent = "无法读取标签数据，请刷新新标签页后重试。";
  renderEmpty(groupsContainer, "无法读取标签数据");
});
