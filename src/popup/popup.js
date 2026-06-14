import { browserApi } from "../shared/browser-api.js";
import {
  activateOpenTab,
  buildPopupState,
  getSidePanelOpenState,
  openTabTrailSidePanel,
  queryOpenTabSnapshots,
  reopenClosedTab,
  setActionClickBehavior
} from "./popup-model.js";

const activeList = document.querySelector("#recent-active-list");
const closedList = document.querySelector("#recent-closed-list");
const openSidePanelButton = document.querySelector("#open-side-panel");
const sidePanelStatus = document.querySelector("#side-panel-status");
const openTabsSummary = document.querySelector("#summary-open-tabs");
const activeSummary = document.querySelector("#summary-recent-active");
const closedSummary = document.querySelector("#summary-recent-closed");
const actionClickBehavior = document.querySelector("#action-click-behavior");

function renderEmpty(list, text) {
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = text;
  list.replaceChildren(item);
}

function renderTabList(list, items, emptyText, onClick) {
  if (items.length === 0) {
    renderEmpty(list, emptyText);
    return;
  }

  list.replaceChildren(...items.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-row";
    button.title = item.tab.url;
    button.addEventListener("click", () => onClick(item.tab));

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = item.tab.title;

    const domain = document.createElement("span");
    domain.className = "tab-domain";
    domain.textContent = item.tab.domain || item.tab.url;

    const time = document.createElement("span");
    time.className = "tab-time";
    time.textContent = item.timeText || "";
    if (item.fullTimeText) {
      time.title = item.fullTimeText;
    }

    const meta = document.createElement("span");
    meta.className = "tab-meta";
    meta.append(domain, time);

    button.append(title, meta);

    const listItem = document.createElement("li");
    listItem.append(button);
    return listItem;
  }));
}

function renderSummary(summary) {
  openTabsSummary.textContent = String(summary.openTabCount);
  activeSummary.textContent = String(summary.recentActiveCount);
  closedSummary.textContent = String(summary.recentClosedCount);
}

function renderSidePanelState() {
  const state = getSidePanelOpenState({ sidePanelApi: browserApi.sidePanel });
  openSidePanelButton.disabled = !state.supported;
  sidePanelStatus.textContent = state.message;
}

async function getCurrentWindowId() {
  if (typeof browserApi.windows?.getCurrent !== "function") {
    return undefined;
  }
  const currentWindow = await browserApi.windows.getCurrent();
  return currentWindow?.id;
}

async function init() {
  renderSidePanelState();
  const openTabs = await queryOpenTabSnapshots(browserApi.tabs);
  const state = await buildPopupState({
    local: browserApi.storage.local,
    sync: browserApi.storage.sync,
    openTabs
  });
  renderSummary(state.summary);
  actionClickBehavior.checked = state.preferences.actionClickBehavior === "side-panel";

  renderTabList(activeList, state.recentActive, "还没有最近活跃标签", (tab) => {
    activateOpenTab({
      tabsApi: browserApi.tabs,
      windowsApi: browserApi.windows
    }, tab);
  });
  renderTabList(closedList, state.recentClosed, "还没有最近关闭标签", (tab) => {
    reopenClosedTab({ tabsApi: browserApi.tabs }, tab);
  });

  openSidePanelButton.addEventListener("click", async () => {
    const result = await openTabTrailSidePanel({
      sidePanelApi: browserApi.sidePanel
    }, await getCurrentWindowId());
    sidePanelStatus.textContent = result.ok ? "侧边栏已打开" : result.message;
  });

  actionClickBehavior.addEventListener("change", async () => {
    const behavior = actionClickBehavior.checked ? "side-panel" : "popup";
    const result = await setActionClickBehavior(browserApi.storage.sync, {
      sidePanelApi: browserApi.sidePanel,
      actionApi: browserApi.action
    }, behavior);
    sidePanelStatus.textContent = result.ok
      ? "扩展图标入口偏好已保存"
      : "扩展图标入口偏好无法同步保存，但本次设置已在当前设备生效";
  });
}

init().catch((error) => {
  console.error(error);
  sidePanelStatus.textContent = "无法初始化 popup，请稍后重试。";
  renderSummary({ openTabCount: 0, recentActiveCount: 0, recentClosedCount: 0 });
  renderEmpty(activeList, "无法读取最近活跃标签");
  renderEmpty(closedList, "无法读取最近关闭标签");
});
