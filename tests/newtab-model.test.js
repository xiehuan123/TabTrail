import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, STORAGE_KEYS } from "../src/shared/constants.js";
import { createActivity, toTabSnapshot } from "../src/shared/recent-activity.js";
import {
  activateTabFromDashboard,
  assignDashboardTabToCategory,
  buildNewTabDashboardState,
  closeDashboardCategory,
  openDashboardSidePanel,
  reopenClosedFromDashboard
} from "../src/newtab/newtab-model.js";

function createArea(initial = {}) {
  const state = new Map(Object.entries(initial));
  return {
    state,
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

test("builds new tab dashboard state from shared side panel data", async () => {
  const now = new Date(2026, 5, 14, 18, 36, 30).getTime();
  const state = await buildNewTabDashboardState({
    local: createArea({
      [STORAGE_KEYS.activity]: [
        createActivity(ACTIVITY_TYPES.activated, { tab: tabs[1], timestamp: now - 5 * 60_000 }),
        createActivity(ACTIVITY_TYPES.closed, {
          tab: { id: 99, windowId: 10, title: "Closed", url: "https://closed.example" },
          timestamp: now
        })
      ]
    }),
    sync: createArea({
      [STORAGE_KEYS.preferences]: {
        manualCategories: { "tab:2": "文档" },
        pinnedKeys: [],
        previewOrders: {},
        defaultScope: "current-window"
      }
    }),
    tabs,
    currentWindowId: 10,
    scope: "current-window",
    query: "docs",
    now
  });

  assert.equal(state.surface, "newtab");
  assert.equal(state.summary.openTabCount, 2);
  assert.equal(state.summary.visibleTabCount, 1);
  assert.equal(state.searchHint, "搜索当前打开的标签");
  assert.deepEqual(state.recentActive.map((item) => item.tab.title), ["Docs"]);
  assert.equal(state.recentClosed[0].timeText, "刚刚");
  assert.ok(state.groups.some((group) => group.id === "manual:文档"));
});

test("builds category-first dashboard summaries and current category tabs", async () => {
  const now = new Date(2026, 5, 14, 18, 36, 30).getTime();
  const state = await buildNewTabDashboardState({
    local: createArea({
      [STORAGE_KEYS.activity]: [
        createActivity(ACTIVITY_TYPES.closed, {
          tab: { id: 99, windowId: 10, title: "Closed", url: "https://closed.example" },
          timestamp: now
        })
      ]
    }),
    sync: createArea({
      [STORAGE_KEYS.preferences]: {
        manualCategories: { "tab:2": "文档" },
        pinnedKeys: [],
        previewOrders: {},
        defaultScope: "current-window"
      }
    }),
    tabs,
    currentWindowId: 10,
    scope: "current-window",
    now
  });

  assert.deepEqual(state.categories.map((category) => category.id), [
    "all",
    "manual:文档",
    "domain:docs.example.com",
    "domain:github.com",
    "system:recently-closed"
  ]);
  assert.equal(state.selectedCategoryId, "all");
  assert.deepEqual(state.currentCategoryTabs.map((tab) => tab.tabId), [1, 2]);
  assert.deepEqual(
    state.categories.map((category) => [
      category.id,
      category.count,
      category.canReceiveDrop,
      category.canClose,
      category.readOnly
    ]),
    [
      ["all", 2, false, false, false],
      ["manual:文档", 1, true, true, false],
      ["domain:docs.example.com", 1, false, true, false],
      ["domain:github.com", 1, false, true, false],
      ["system:recently-closed", 1, false, false, true]
    ]
  );
});

test("selects a requested dashboard category and falls back when it disappears", async () => {
  const sync = createArea({
    [STORAGE_KEYS.preferences]: {
      manualCategories: { "tab:2": "文档" },
      pinnedKeys: [],
      previewOrders: {},
      defaultScope: "current-window"
    }
  });
  const manualState = await buildNewTabDashboardState({
    local: createArea(),
    sync,
    tabs,
    currentWindowId: 10,
    scope: "current-window",
    categoryId: "manual:文档"
  });
  const fallbackState = await buildNewTabDashboardState({
    local: createArea(),
    sync,
    tabs,
    currentWindowId: 10,
    scope: "current-window",
    categoryId: "manual:不存在"
  });

  assert.equal(manualState.selectedCategoryId, "manual:文档");
  assert.deepEqual(manualState.currentCategoryTabs.map((tab) => tab.tabId), [2]);
  assert.equal(fallbackState.selectedCategoryId, "all");
  assert.deepEqual(fallbackState.currentCategoryTabs.map((tab) => tab.tabId), [1, 2]);
});

test("assigns a dragged open tab to a manual dashboard category only", async () => {
  const sync = createArea({
    [STORAGE_KEYS.preferences]: {
      manualCategories: { "tab:2": "文档" },
      pinnedKeys: [],
      previewOrders: {},
      defaultScope: "current-window"
    }
  });
  const preferences = sync.state.get(STORAGE_KEYS.preferences);

  await assignDashboardTabToCategory(sync, preferences, tabs[0], "manual:文档");

  assert.deepEqual(sync.state.get(STORAGE_KEYS.preferences).manualCategories, {
    "tab:1": "文档",
    "tab:2": "文档"
  });
  await assert.rejects(
    () => assignDashboardTabToCategory(sync, preferences, tabs[0], "system:recently-closed"),
    /Only manual categories can receive dragged tabs/
  );
  await assert.rejects(
    () => assignDashboardTabToCategory(sync, preferences, { title: "Closed" }, "manual:文档"),
    /Only open tabs can be manually categorized/
  );
});

test("closes manual or domain dashboard categories and rejects protected categories", async () => {
  const calls = [];
  const tabsApi = {
    async remove(tabIds) {
      calls.push(["tabs.remove", tabIds]);
    }
  };
  const confirmCalls = [];
  const confirm = async (details) => {
    confirmCalls.push(details);
    return true;
  };
  const manualCategory = {
    id: "manual:工作",
    title: "工作",
    kind: "manual",
    tabs: [tabs[0], tabs[1]]
  };
  const allCategory = {
    id: "all",
    title: "全部",
    kind: "all",
    tabs
  };

  assert.deepEqual(await closeDashboardCategory({ tabsApi, confirm }, manualCategory), {
    closed: true,
    confirmed: true,
    count: 2,
    tabIds: [1, 2]
  });
  assert.deepEqual(confirmCalls, [{ categoryTitle: "工作", count: 2 }]);
  assert.deepEqual(calls, [["tabs.remove", [1, 2]]]);
  await assert.rejects(
    () => closeDashboardCategory({ tabsApi, confirm }, allCategory),
    /This dashboard category cannot be closed/
  );
  await assert.rejects(
    () => closeDashboardCategory({ tabsApi, confirm }, { id: "system:recently-closed", kind: "system", tabs: [] }),
    /This dashboard category cannot be closed/
  );
});

test("dashboard can activate open tabs reopen closed tabs and open side panel", async () => {
  const calls = [];
  const tabsApi = {
    async update(tabId, options) {
      calls.push(["tabs.update", tabId, options]);
    },
    async create(options) {
      calls.push(["tabs.create", options]);
    }
  };
  const windowsApi = {
    async update(windowId, options) {
      calls.push(["windows.update", windowId, options]);
    }
  };
  const sidePanelApi = {
    async open(options) {
      calls.push(["sidePanel.open", options]);
    }
  };

  await activateTabFromDashboard({ tabsApi, windowsApi }, tabs[0]);
  await reopenClosedFromDashboard({ tabsApi }, { url: "https://closed.example" });
  assert.deepEqual(await openDashboardSidePanel({ sidePanelApi }, 10), { ok: true });

  assert.deepEqual(calls, [
    ["windows.update", 10, { focused: true }],
    ["tabs.update", 1, { active: true }],
    ["tabs.create", { url: "https://closed.example" }],
    ["sidePanel.open", { windowId: 10 }]
  ]);
});
