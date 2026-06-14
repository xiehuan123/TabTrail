import { browserApi } from "../shared/browser-api.js";
import { toTabSnapshot } from "../shared/recent-activity.js";
import {
  applyPreviewOrderToTabStrip,
  buildSidePanelState,
  clearRecentlyClosed,
  closeSelectedTabs,
  reorderPreviewTabs,
  SCOPES
} from "./sidepanel-model.js";

const groups = document.querySelector("#tab-groups");
const search = document.querySelector("#tab-search");
const buttons = [...document.querySelectorAll(".scope-button")];
let scope = SCOPES.currentWindow;
let currentWindowId = null;
let latestState = null;
let previewTabs = [];
const selectedTabIds = new Set();

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    scope = button.dataset.scope;
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

search.addEventListener("input", () => render());

function renderEmpty(text) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = text;
  groups.replaceChildren(empty);
}

function createTabRow(tab, index, group) {
  const item = document.createElement("li");
  item.className = "tab-item";
  item.draggable = !group.readOnly;

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
  });

  const title = document.createElement("span");
  title.className = "tab-title";
  title.textContent = tab.title;

  const domain = document.createElement("span");
  domain.className = "tab-domain";
  domain.textContent = tab.domain || tab.url;

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

  item.append(checkbox, details, pinButton, upButton, downButton);
  return item;
}

function renderGroups(state) {
  const visibleGroups = state.groups.filter((group) => {
    return group.tabs.length > 0 || group.id === "system:recently-closed";
  });

  if (visibleGroups.length === 0) {
    renderEmpty("没有匹配的标签");
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "panel-toolbar";

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

  toolbar.append(applyButton, closeButton);

  groups.replaceChildren(toolbar, ...visibleGroups.map((group) => {
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
  renderGroups(latestState);
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
