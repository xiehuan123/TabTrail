import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, STORAGE_KEYS } from "../src/shared/constants.js";
import { createActivity, toTabSnapshot } from "../src/shared/recent-activity.js";
import {
  buildSidePanelState,
  filterTabs,
  groupTabsByDomain,
  selectTabsByScope
} from "../src/sidepanel/sidepanel-model.js";

function createArea(initial = {}) {
  const state = new Map(Object.entries(initial));
  return {
    async get(key) {
      return { [key]: state.get(key) };
    },
    async set(values) {
      for (const [key, value] of Object.entries(values)) {
        state.set(key, value);
      }
    }
  };
}

const tabs = [
  toTabSnapshot({ id: 1, windowId: 10, title: "GitHub Issue", url: "https://github.com/acme/issue" }),
  toTabSnapshot({ id: 2, windowId: 10, title: "Docs", url: "https://docs.example.com/guide" }),
  toTabSnapshot({ id: 3, windowId: 20, title: "Mail", url: "https://mail.example.com/inbox" })
];

test("selects current window tabs by default and can select all windows", () => {
  assert.deepEqual(selectTabsByScope(tabs, "current-window", 10).map((tab) => tab.tabId), [1, 2]);
  assert.deepEqual(selectTabsByScope(tabs, "all-windows", 10).map((tab) => tab.tabId), [1, 2, 3]);
});

test("groups visible tabs by website domain", () => {
  const groups = groupTabsByDomain(tabs);

  assert.deepEqual(groups.map((group) => group.id), [
    "domain:docs.example.com",
    "domain:github.com",
    "domain:mail.example.com"
  ]);
  assert.equal(groups[1].title, "github.com");
  assert.deepEqual(groups[1].tabs.map((tab) => tab.tabId), [1]);
});

test("filters tabs by title url and domain", () => {
  assert.deepEqual(filterTabs(tabs, "github").map((tab) => tab.tabId), [1]);
  assert.deepEqual(filterTabs(tabs, "guide").map((tab) => tab.tabId), [2]);
  assert.deepEqual(filterTabs(tabs, "mail.example").map((tab) => tab.tabId), [3]);
});

test("builds manual categories from currently open visible tabs only", async () => {
  const state = await buildSidePanelState({
    local: createArea(),
    sync: createArea({
      [STORAGE_KEYS.preferences]: {
        manualCategories: {
          "tab:1": "工作",
          "tab:3": "工作",
          "tab:99": "稍后看"
        },
        pinnedKeys: [],
        previewOrders: {},
        defaultScope: "current-window"
      }
    }),
    tabs,
    currentWindowId: 10,
    scope: "current-window"
  });

  const manual = state.groups.find((group) => group.id === "manual:工作");
  assert.deepEqual(manual.tabs.map((tab) => tab.tabId), [1]);
});

test("builds read-only recently closed system group", async () => {
  const activity = [
    createActivity(ACTIVITY_TYPES.closed, {
      tab: { id: 4, windowId: 10, title: "Closed", url: "https://closed.example" },
      timestamp: 4
    })
  ];

  const state = await buildSidePanelState({
    local: createArea({ [STORAGE_KEYS.activity]: activity }),
    sync: createArea(),
    tabs,
    currentWindowId: 10,
    scope: "current-window"
  });

  const closed = state.groups.find((group) => group.id === "system:recently-closed");
  assert.equal(closed.readOnly, true);
  assert.deepEqual(closed.tabs.map((tab) => tab.title), ["Closed"]);
});

test("searches only within the selected scope", async () => {
  const currentWindowState = await buildSidePanelState({
    local: createArea(),
    sync: createArea(),
    tabs,
    currentWindowId: 10,
    scope: "current-window",
    query: "mail"
  });
  const allWindowState = await buildSidePanelState({
    local: createArea(),
    sync: createArea(),
    tabs,
    currentWindowId: 10,
    scope: "all-windows",
    query: "mail"
  });

  assert.equal(currentWindowState.visibleTabs.length, 0);
  assert.deepEqual(allWindowState.visibleTabs.map((tab) => tab.tabId), [3]);
});
