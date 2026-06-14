import { browserApi } from "../shared/browser-api.js";
import { toTabSnapshot } from "../shared/recent-activity.js";
import {
  buildSidePanelState,
  clearRecentlyClosed,
  SCOPES
} from "./sidepanel-model.js";

const groups = document.querySelector("#tab-groups");
const search = document.querySelector("#tab-search");
const buttons = [...document.querySelectorAll(".scope-button")];
let scope = SCOPES.currentWindow;
let currentWindowId = null;

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

function createTabRow(tab) {
  const item = document.createElement("li");
  item.className = "tab-item";

  const title = document.createElement("span");
  title.className = "tab-title";
  title.textContent = tab.title;

  const domain = document.createElement("span");
  domain.className = "tab-domain";
  domain.textContent = tab.domain || tab.url;

  item.append(title, domain);
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
    list.replaceChildren(...group.tabs.map(createTabRow));

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
  const state = await buildSidePanelState({
    local: browserApi.storage.local,
    sync: browserApi.storage.sync,
    tabs,
    currentWindowId,
    scope,
    query: search.value
  });
  renderGroups(state);
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
