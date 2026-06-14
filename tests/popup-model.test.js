import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, STORAGE_KEYS } from "../src/shared/constants.js";
import { createActivity, toTabSnapshot } from "../src/shared/recent-activity.js";
import {
  activateOpenTab,
  buildPopupState,
  getSidePanelOpenState,
  setActionClickBehavior,
  openTabTrailSidePanel,
  reopenClosedTab
} from "../src/popup/popup-model.js";

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

test("builds popup state with 8 active and 8 closed records", async () => {
  const activities = [];
  const openTabs = [];
  const now = new Date(2026, 5, 14, 18, 36, 30).getTime();

  for (let index = 0; index < 12; index += 1) {
    const tab = { id: index, windowId: 1, title: `Active ${index}`, url: `https://a.example/${index}` };
    const timestamp = now - ((11 - index) * 60_000);
    openTabs.push(toTabSnapshot(tab));
    activities.push(createActivity(ACTIVITY_TYPES.activated, { tab, timestamp }));
    activities.push(createActivity(ACTIVITY_TYPES.closed, {
      tab: { id: index + 100, windowId: 1, title: `Closed ${index}`, url: `https://c.example/${index}` },
      timestamp
    }));
  }

  const state = await buildPopupState({
    local: createArea({ [STORAGE_KEYS.activity]: activities }),
    sync: createArea(),
    openTabs,
    now
  });

  assert.equal(state.recentActive.length, 8);
  assert.equal(state.recentClosed.length, 8);
  assert.equal(state.recentActive[0].tab.title, "Active 11");
  assert.equal(state.recentClosed[0].tab.title, "Closed 11");
  assert.deepEqual(state.summary, {
    openTabCount: 12,
    recentActiveCount: 8,
    recentClosedCount: 8
  });
  assert.equal(state.recentActive[0].timeText, "刚刚");
  assert.equal(state.recentClosed[0].timeText, "刚刚");
  assert.equal(state.preferences.actionClickBehavior, "popup");
});

test("prioritizes extension-pinned active tabs in popup state", async () => {
  const activities = [
    createActivity(ACTIVITY_TYPES.activated, {
      tab: { id: 1, windowId: 1, title: "Normal", url: "https://normal.example" },
      timestamp: 10
    }),
    createActivity(ACTIVITY_TYPES.activated, {
      tab: { id: 2, windowId: 1, title: "Pinned", url: "https://pinned.example" },
      timestamp: 1
    })
  ];

  const state = await buildPopupState({
    local: createArea({ [STORAGE_KEYS.activity]: activities }),
    sync: createArea({
      [STORAGE_KEYS.preferences]: {
        manualCategories: {},
        pinnedKeys: ["url:https://pinned.example"],
        previewOrders: {},
        defaultScope: "current-window"
      }
    }),
    openTabs: [
      toTabSnapshot({ id: 1, windowId: 1, title: "Normal", url: "https://normal.example" }),
      toTabSnapshot({ id: 2, windowId: 1, title: "Pinned", url: "https://pinned.example" })
    ]
  });

  assert.deepEqual(state.recentActive.map((item) => item.tab.title), ["Pinned", "Normal"]);
});

test("activates an open tab from popup", async () => {
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

  await activateOpenTab({ tabsApi, windowsApi }, { tabId: 3, windowId: 7 });

  assert.deepEqual(calls, [
    ["windows.update", 7, { focused: true }],
    ["tabs.update", 3, { active: true }]
  ]);
});

test("reopens a closed tab from popup URL", async () => {
  const created = [];
  const tabsApi = {
    async create(options) {
      created.push(options);
    }
  };

  await reopenClosedTab({ tabsApi }, { url: "https://closed.example/page" });

  assert.deepEqual(created, [{ url: "https://closed.example/page" }]);
});

test("opens TabTrail side panel when API is available", async () => {
  const calls = [];
  const runtime = { id: "extension-id" };
  const sidePanelApi = {
    async open(options) {
      calls.push(["open", options]);
    }
  };

  const result = await openTabTrailSidePanel({ runtime, sidePanelApi }, 9);

  assert.deepEqual(calls, [["open", { windowId: 9 }]]);
  assert.deepEqual(result, { ok: true });
});

test("reports a side panel fallback when open API is unavailable", async () => {
  assert.deepEqual(
    await openTabTrailSidePanel({ runtime: { id: "extension-id" } }, 9),
    {
      ok: false,
      reason: "unsupported",
      message: "当前浏览器不支持自动打开侧边栏，请从扩展菜单中手动打开 TabTrail。"
    }
  );

  assert.deepEqual(getSidePanelOpenState({ sidePanelApi: { open() {} } }), {
    supported: true,
    message: "可以自动打开侧边栏"
  });
  assert.deepEqual(getSidePanelOpenState({}), {
    supported: false,
    message: "当前浏览器不支持自动打开侧边栏，请从扩展菜单中手动打开 TabTrail。"
  });
});

test("configures action click behavior for side panel or popup", async () => {
  const calls = [];
  const sidePanelApi = {
    async setPanelBehavior(options) {
      calls.push(["sidePanel.setPanelBehavior", options]);
    }
  };
  const actionApi = {
    async setPopup(options) {
      calls.push(["action.setPopup", options]);
    }
  };
  const sync = createArea();

  const sidePanelResult = await setActionClickBehavior(sync, { sidePanelApi, actionApi }, "side-panel");
  const popupResult = await setActionClickBehavior(sync, { sidePanelApi, actionApi }, "popup");

  assert.deepEqual(calls, [
    ["sidePanel.setPanelBehavior", { openPanelOnActionClick: true }],
    ["action.setPopup", { popup: "" }],
    ["sidePanel.setPanelBehavior", { openPanelOnActionClick: false }],
    ["action.setPopup", { popup: "src/popup/popup.html" }]
  ]);
  assert.equal(sidePanelResult.preferences.actionClickBehavior, "side-panel");
  assert.equal(popupResult.preferences.actionClickBehavior, "popup");
});
