import { browserApi } from "../shared/browser-api.js";
import {
  activateOpenTab,
  buildPopupState,
  queryOpenTabSnapshots,
  reopenClosedTab
} from "./popup-model.js";

const activeList = document.querySelector("#recent-active-list");
const closedList = document.querySelector("#recent-closed-list");

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

    button.append(title, domain);

    const listItem = document.createElement("li");
    listItem.append(button);
    return listItem;
  }));
}

async function init() {
  const openTabs = await queryOpenTabSnapshots(browserApi.tabs);
  const state = await buildPopupState({
    local: browserApi.storage.local,
    sync: browserApi.storage.sync,
    openTabs
  });

  renderTabList(activeList, state.recentActive, "还没有最近活跃标签", (tab) => {
    activateOpenTab({
      tabsApi: browserApi.tabs,
      windowsApi: browserApi.windows
    }, tab);
  });
  renderTabList(closedList, state.recentClosed, "还没有最近关闭标签", (tab) => {
    reopenClosedTab({ tabsApi: browserApi.tabs }, tab);
  });
}

init().catch((error) => {
  console.error(error);
  renderEmpty(activeList, "无法读取最近活跃标签");
  renderEmpty(closedList, "无法读取最近关闭标签");
});
