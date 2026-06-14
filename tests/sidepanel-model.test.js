import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, STORAGE_KEYS } from "../src/shared/constants.js";
import { createActivity, toTabSnapshot } from "../src/shared/recent-activity.js";
import {
  applyPreviewOrderToTabStrip,
  assignCategoryToTabs,
  assignManualCategory,
  activateTabFromPanel,
  buildSidePanelState,
  closeSelectedTabs,
  filterTabs,
  groupTabsByDomain,
  reorderPreviewTabs,
  reopenRecentlyClosedFromPanel,
  selectTabsByScope
} from "../src/sidepanel/sidepanel-model.js";

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

test("assigns selected open tabs to a manual category", async () => {
  const sync = createArea({
    [STORAGE_KEYS.preferences]: {
      manualCategories: {},
      pinnedKeys: [],
      previewOrders: {},
      defaultScope: "current-window"
    }
  });
  const preferences = (await buildSidePanelState({
    local: createArea(),
    sync,
    tabs,
    currentWindowId: 10,
    scope: "current-window"
  })).preferences;

  await assignCategoryToTabs(sync, preferences, [tabs[0], tabs[1]], "工作");

  assert.deepEqual(sync.state.get(STORAGE_KEYS.preferences).manualCategories, {
    "tab:1": "工作",
    "tab:2": "工作"
  });
});

test("rejects assigning recently closed records to manual categories", async () => {
  const sync = createArea({
    [STORAGE_KEYS.preferences]: {
      manualCategories: {},
      pinnedKeys: [],
      previewOrders: {},
      defaultScope: "current-window"
    }
  });

  await assert.rejects(
    () => assignManualCategory(sync, sync.state.get(STORAGE_KEYS.preferences), {
      title: "Closed",
      url: "https://closed.example",
      domain: "closed.example"
    }, "工作"),
    /Only open tabs can be manually categorized/
  );
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

test("reorders preview tabs without calling browser tab movement", () => {
  const tabsApi = {
    move() {
      throw new Error("tabs.move must not be called during preview sorting");
    }
  };

  const reordered = reorderPreviewTabs(tabs, 3, 0, tabsApi);

  assert.deepEqual(reordered.map((tab) => tab.tabId), [3, 1, 2]);
});

test("applies preview order to the browser tab strip only when requested", async () => {
  const calls = [];
  const tabsApi = {
    async move(tabId, options) {
      calls.push([tabId, options]);
    }
  };

  await applyPreviewOrderToTabStrip(tabsApi, tabs.slice().reverse());

  assert.deepEqual(calls, [
    [3, { index: 0, windowId: 20 }],
    [2, { index: 0, windowId: 10 }],
    [1, { index: 1, windowId: 10 }]
  ]);
});

test("closes one or two selected tabs without confirmation", async () => {
  const calls = [];
  const tabsApi = {
    async remove(tabIds) {
      calls.push(tabIds);
    }
  };

  const result = await closeSelectedTabs({ tabsApi }, [1, 2]);

  assert.deepEqual(calls, [[1, 2]]);
  assert.deepEqual(result, { closed: true, confirmed: false, count: 2 });
});

test("requires confirmation before closing three or more tabs", async () => {
  const calls = [];
  const tabsApi = {
    async remove(tabIds) {
      calls.push(tabIds);
    }
  };

  const rejected = await closeSelectedTabs({ tabsApi, confirm: async () => false }, [1, 2, 3]);
  const accepted = await closeSelectedTabs({ tabsApi, confirm: async () => true }, [1, 2, 3]);

  assert.deepEqual(rejected, { closed: false, confirmed: false, count: 3 });
  assert.deepEqual(accepted, { closed: true, confirmed: true, count: 3 });
  assert.deepEqual(calls, [[1, 2, 3]]);
});

test("stores extension pinned state without changing native pinned state", async () => {
  const sync = createArea({
    [STORAGE_KEYS.preferences]: {
      manualCategories: {},
      pinnedKeys: [],
      previewOrders: {},
      defaultScope: "current-window"
    }
  });
  const tabsApi = {
    async update() {
      throw new Error("native pinned state must not be changed");
    }
  };

  const state = await buildSidePanelState({
    local: createArea(),
    sync,
    tabs,
    currentWindowId: 10,
    scope: "current-window"
  });

  await state.actions.togglePinned(tabs[0], tabsApi);

  assert.deepEqual(sync.state.get(STORAGE_KEYS.preferences).pinnedKeys, [
    "url:https://github.com/acme/issue"
  ]);
});

test("prioritizes pinned tabs in side panel visible tabs", async () => {
  const state = await buildSidePanelState({
    local: createArea(),
    sync: createArea({
      [STORAGE_KEYS.preferences]: {
        manualCategories: {},
        pinnedKeys: ["url:https://docs.example.com/guide"],
        previewOrders: {},
        defaultScope: "current-window"
      }
    }),
    tabs,
    currentWindowId: 10,
    scope: "current-window"
  });

  assert.deepEqual(state.visibleTabs.map((tab) => tab.tabId), [2, 1]);
});

test("applies preview order per browser window", async () => {
  const calls = [];
  const tabsApi = {
    async move(tabId, options) {
      calls.push([tabId, options]);
    }
  };

  await applyPreviewOrderToTabStrip(tabsApi, [
    toTabSnapshot({ id: 3, windowId: 20, title: "Mail", url: "https://mail.example.com/inbox" }),
    toTabSnapshot({ id: 2, windowId: 10, title: "Docs", url: "https://docs.example.com/guide" }),
    toTabSnapshot({ id: 1, windowId: 10, title: "GitHub", url: "https://github.com/acme" })
  ]);

  assert.deepEqual(calls, [
    [3, { index: 0, windowId: 20 }],
    [2, { index: 0, windowId: 10 }],
    [1, { index: 1, windowId: 10 }]
  ]);
});

test("activates a tab from side panel", async () => {
  const calls = [];
  const tabsApi = {
    async update(tabId, options) {
      calls.push(["tabs.update", tabId, options]);
    }
  };
  const windowsApi = {
    async update(windowId, options) {
      calls.push(["windows.update", windowId, options]);
    }
  };

  await activateTabFromPanel({ tabsApi, windowsApi }, tabs[0]);

  assert.deepEqual(calls, [
    ["windows.update", 10, { focused: true }],
    ["tabs.update", 1, { active: true }]
  ]);
});

test("reopens a recently closed tab from side panel", async () => {
  const calls = [];
  const tabsApi = {
    async create(options) {
      calls.push(options);
    }
  };

  await reopenRecentlyClosedFromPanel({ tabsApi }, {
    title: "Closed",
    url: "https://closed.example/page"
  });

  assert.deepEqual(calls, [{ url: "https://closed.example/page" }]);
});
