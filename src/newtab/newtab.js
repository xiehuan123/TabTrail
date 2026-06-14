import { browserApi } from "../shared/browser-api.js";
import {
  captureFocusKey,
  createDebouncedTask,
  createStatusMessage,
  restoreFocusByKey
} from "../shared/interaction-helpers.js";
import { toTabSnapshot } from "../shared/recent-activity.js";
import {
  activateTabFromDashboard,
  assignDashboardTabToCategory,
  buildNewTabDashboardState,
  closeDashboardCategory,
  reopenClosedFromDashboard
} from "./newtab-model.js";
import {
  applyPreviewOrderToTabStrip,
  assignCategoryToTabs,
  closeSelectedTabs,
  reorderPreviewTabs,
  SCOPES
} from "../sidepanel/sidepanel-model.js";

const search = document.querySelector("#dashboard-search");
const scopeButtons = [...document.querySelectorAll(".scope-button")];
const categoryGrid = document.querySelector("#dashboard-category-grid");
const categoryName = document.querySelector("#dashboard-category-name");
const assignCategoryButton = document.querySelector("#dashboard-assign-category");
const currentCategoryTitle = document.querySelector("#dashboard-current-title");
const currentList = document.querySelector("#dashboard-current-list");
const activeList = document.querySelector("#dashboard-active-list");
const closedList = document.querySelector("#dashboard-closed-list");
const openCount = document.querySelector("#dashboard-open-count");
const visibleCount = document.querySelector("#dashboard-visible-count");
const closedCount = document.querySelector("#dashboard-closed-count");
const applyOrderButton = document.querySelector("#dashboard-apply-order");
const closeCategoryButton = document.querySelector("#dashboard-close-category");
const closeSelectedButton = document.querySelector("#dashboard-close-selected");
const message = document.querySelector("#dashboard-message");

let scope = SCOPES.currentWindow;
let currentWindowId = null;
let latestState = null;
let previewTabs = [];
let selectedCategoryId = "all";
let draggedTabId = null;
let hasPendingOrder = false;
const selectedTabIds = new Set();
const pendingOrderMessage = "有未应用排序";

function announce(text) {
  message.textContent = text;
}

function syncScopeButtons() {
  scopeButtons.forEach((button) => {
    const active = button.dataset.scope === scope;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderEmpty(container, text) {
  const empty = document.createElement(container.tagName === "UL" ? "li" : "p");
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

function createTabRow(tab, group, index = 0, sourceTabs = previewTabs) {
  const item = document.createElement("li");
  item.className = "tab-row";
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
  item.addEventListener("dragend", () => {
    draggedTabId = null;
    clearDropTargets();
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "tab-select";
  checkbox.dataset.tabId = String(tab.tabId);
  checkbox.dataset.control = "select";
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
  button.dataset.tabId = String(tab.tabId);
  button.dataset.control = "open";
  button.setAttribute("aria-label", group.readOnly ? `重新打开 ${tab.title}` : `切换到 ${tab.title}`);
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

  const moveCategoryButton = document.createElement("button");
  moveCategoryButton.type = "button";
  moveCategoryButton.className = "move-category";
  moveCategoryButton.dataset.tabId = String(tab.tabId);
  moveCategoryButton.dataset.control = "move-category";
  moveCategoryButton.textContent = "移动到分类";
  moveCategoryButton.disabled = group.readOnly;
  moveCategoryButton.setAttribute("aria-label", `移动 ${tab.title} 到当前分类输入的分类`);
  moveCategoryButton.addEventListener("click", async () => {
    const name = categoryName.value.trim();
    if (!name) {
      announce("请输入分类名");
      categoryName.focus();
      return;
    }
    await assignCategoryToTabs(browserApi.storage.sync, latestState.preferences, [tab], name);
    selectedCategoryId = `manual:${name}`;
    announce(createStatusMessage("category-assigned", { count: 1, category: name }));
    await render();
  });

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.className = "icon-button";
  upButton.dataset.tabId = String(tab.tabId);
  upButton.dataset.control = "move-up";
  upButton.textContent = "↑";
  upButton.disabled = group.readOnly || index === 0;
  upButton.setAttribute("aria-label", `将 ${tab.title} 上移`);
  upButton.addEventListener("click", () => {
    const focusKey = captureFocusKey(document);
    const targetIndex = Math.max(0, previewTabs.findIndex((itemTab) => itemTab.tabId === tab.tabId) - 1);
    previewTabs = reorderPreviewTabs(previewTabs, tab.tabId, targetIndex);
    hasPendingOrder = true;
    announce(`${latestState.summary.scopeLabel}${pendingOrderMessage}`);
    renderCurrentCategory(latestState, focusKey);
    renderActionState();
  });

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.className = "icon-button";
  downButton.dataset.tabId = String(tab.tabId);
  downButton.dataset.control = "move-down";
  downButton.textContent = "↓";
  downButton.disabled = group.readOnly || index >= sourceTabs.length - 1;
  downButton.setAttribute("aria-label", `将 ${tab.title} 下移`);
  downButton.addEventListener("click", () => {
    const focusKey = captureFocusKey(document);
    const targetIndex = Math.min(previewTabs.length - 1, previewTabs.findIndex((itemTab) => itemTab.tabId === tab.tabId) + 1);
    previewTabs = reorderPreviewTabs(previewTabs, tab.tabId, targetIndex);
    hasPendingOrder = true;
    announce(`${latestState.summary.scopeLabel}${pendingOrderMessage}`);
    renderCurrentCategory(latestState, focusKey);
    renderActionState();
  });

  item.append(checkbox, button, moveCategoryButton, upButton, downButton);
  return item;
}

function getCategoryTabs(category) {
  if (category.kind === "all") {
    return previewTabs;
  }
  if (category.kind === "domain") {
    const ids = new Set(category.tabs.map((tab) => tab.tabId));
    return previewTabs.filter((tab) => ids.has(tab.tabId));
  }
  if (category.kind === "manual") {
    const ids = new Set(category.tabs.map((tab) => tab.tabId));
    return previewTabs.filter((tab) => ids.has(tab.tabId));
  }
  return category.tabs;
}

function renderCategories(state) {
  categoryGrid.replaceChildren(...state.categories.map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";
    button.dataset.categoryId = category.id;
    button.dataset.kind = category.kind;
    button.dataset.canReceiveDrop = category.canReceiveDrop ? "true" : "false";
    if (category.readOnly) {
      button.dataset.readOnly = "true";
    }
    if (category.canReceiveDrop) {
      button.classList.add("can-drop");
    }
    button.classList.toggle("is-active", category.id === state.selectedCategoryId);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", category.id === state.selectedCategoryId ? "true" : "false");
    button.setAttribute("aria-label", `分类 ${category.title}，${category.count} 个标签`);

    const title = document.createElement("span");
    title.className = "category-title";
    title.textContent = category.title;

    const meta = document.createElement("span");
    meta.className = "category-meta";
    meta.textContent = `${category.count} 个标签`;

    button.append(title, meta);
    button.addEventListener("click", () => {
      selectedCategoryId = category.id;
      render();
    });
    button.addEventListener("dragenter", (event) => {
      if (!canDropOnCategory(button)) {
        return;
      }
      event.preventDefault();
      button.classList.add("is-drop-target");
    });
    button.addEventListener("dragover", (event) => {
      if (!canDropOnCategory(button)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      button.classList.add("is-drop-target");
    });
    button.addEventListener("dragleave", () => {
      button.classList.remove("is-drop-target");
    });
    button.addEventListener("drop", async (event) => {
      event.preventDefault();
      button.classList.remove("is-drop-target");
      if (!canDropOnCategory(button)) {
        return;
      }
      const tab = previewTabs.find((item) => item.tabId === draggedTabId);
      if (!tab) {
        return;
      }
      await assignDashboardTabToCategory(
        browserApi.storage.sync,
        latestState.preferences,
        tab,
        category.id
      );
      selectedCategoryId = category.id;
      draggedTabId = null;
      announce(`已归类到 ${category.title}`);
      await render();
    });
    return button;
  }));
}

function canDropOnCategory(button) {
  return draggedTabId !== null && button.dataset.canReceiveDrop === "true";
}

function clearDropTargets() {
  categoryGrid.querySelectorAll(".is-drop-target").forEach((button) => {
    button.classList.remove("is-drop-target");
  });
}

function renderCurrentCategory(state, focusKey = null) {
  if (state.emptyState.reason) {
    currentCategoryTitle.textContent = state.emptyState.title;
    renderEmpty(currentList, state.emptyState.description || state.emptyState.title);
    return;
  }

  const category = state.currentCategory;
  const sourceTabs = getCategoryTabs(category);
  currentCategoryTitle.textContent = `${category.title} (${sourceTabs.length})`;
  if (sourceTabs.length === 0) {
    renderEmpty(currentList, "这个分类暂时没有标签");
    return;
  }
  currentList.replaceChildren(...sourceTabs.map((tab, index) => createTabRow(tab, category, index, sourceTabs)));
  restoreFocusByKey(document, focusKey);
}

function renderActionState() {
  const category = latestState?.currentCategory || { id: "all", readOnly: false, canClose: false };
  closeSelectedButton.textContent = `关闭已选 (${selectedTabIds.size})`;
  closeSelectedButton.disabled = selectedTabIds.size === 0;
  applyOrderButton.disabled = previewTabs.length === 0 || !hasPendingOrder;
  applyOrderButton.textContent = hasPendingOrder ? "应用排序" : "排序已同步";
  assignCategoryButton.disabled = selectedTabIds.size === 0 || !categoryName.value.trim();
  closeCategoryButton.hidden = !category.canClose;
  closeCategoryButton.disabled = category.id === "all" || category.readOnly || !category.canClose;
  closeCategoryButton.textContent = category.canClose ? `关闭分类 (${category.count})` : "关闭分类";
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
    query: search.value,
    categoryId: selectedCategoryId
  });
  selectedCategoryId = latestState.selectedCategoryId;
  previewTabs = latestState.visibleTabs;
  renderSummary(latestState);
  syncScopeButtons();
  renderCategories(latestState);
  renderCompactList(activeList, latestState.recentActive, "还没有最近活跃标签", (tab) => {
    activateTabFromDashboard({ tabsApi: browserApi.tabs, windowsApi: browserApi.windows }, tab);
  });
  renderCompactList(closedList, latestState.recentClosed, "最近关闭为空", (tab) => {
    reopenClosedFromDashboard({ tabsApi: browserApi.tabs }, tab);
  });
  renderCurrentCategory(latestState);
  renderActionState();
}

scopeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scope = button.dataset.scope;
    selectedTabIds.clear();
    syncScopeButtons();
    render();
  });
});

const debouncedRender = createDebouncedTask(() => render(), 120);

search.addEventListener("input", () => debouncedRender());

categoryName.addEventListener("input", () => renderActionState());

assignCategoryButton.addEventListener("click", async () => {
  const selected = previewTabs.filter((tab) => selectedTabIds.has(tab.tabId));
  const name = categoryName.value.trim();
  if (selected.length === 0) {
    announce("请先选择要归类的标签");
    renderActionState();
    return;
  }
  if (!name) {
    announce("请输入分类名");
    renderActionState();
    return;
  }

  await assignCategoryToTabs(browserApi.storage.sync, latestState.preferences, selected, name);
  selectedTabIds.clear();
  categoryName.value = "";
  selectedCategoryId = `manual:${name}`;
  announce(createStatusMessage("category-assigned", { count: selected.length, category: name }));
  await render();
});

applyOrderButton.addEventListener("click", async () => {
  await applyPreviewOrderToTabStrip(browserApi.tabs, previewTabs);
  hasPendingOrder = false;
  await render();
  announce(createStatusMessage("sort-applied", { scopeLabel: latestState.summary.scopeLabel }));
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
    announce(result.recovery?.message || `已关闭 ${result.count} 个标签，可从最近关闭恢复`);
  }
});

closeCategoryButton.addEventListener("click", async () => {
  const category = latestState.currentCategory;
  if (category.id === "all" || category.readOnly || !category.canClose) {
    return;
  }
  const result = await closeDashboardCategory({
    tabsApi: browserApi.tabs,
    confirm: async ({ categoryTitle, count }) => {
      return globalThis.confirm(`确定关闭分类「${categoryTitle}」中的 ${count} 个标签？`);
    }
  }, category);
  if (result.closed) {
    selectedTabIds.clear();
    selectedCategoryId = "all";
    announce(result.recovery?.message || `已关闭分类「${category.title}」中的 ${result.count} 个标签，可从最近关闭恢复`);
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
  renderEmpty(currentList, "无法读取标签数据");
});
