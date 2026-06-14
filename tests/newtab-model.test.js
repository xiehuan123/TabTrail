import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, STORAGE_KEYS } from "../src/shared/constants.js";
import { createActivity, toTabSnapshot } from "../src/shared/recent-activity.js";
import {
  activateTabFromDashboard,
  buildNewTabDashboardState,
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
