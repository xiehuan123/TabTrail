import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, LIMITS, STORAGE_KEYS } from "../src/shared/constants.js";
import {
  appendActivity,
  clearClosedActivities,
  createActivity,
  getRecentActiveTabs,
  getRecentClosedTabs,
  toTabSnapshot
} from "../src/shared/recent-activity.js";

function createArea() {
  const state = new Map();

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

test("creates tab activity records with tab snapshot details", () => {
  const activity = createActivity(ACTIVITY_TYPES.opened, {
    tab: {
      id: 12,
      windowId: 4,
      title: "Example Page",
      url: "https://docs.example.com/a",
      pinned: true
    },
    timestamp: 1000
  });

  assert.equal(activity.type, "opened");
  assert.equal(activity.timestamp, 1000);
  assert.equal(activity.tab.tabId, 12);
  assert.equal(activity.tab.windowId, 4);
  assert.equal(activity.tab.title, "Example Page");
  assert.equal(activity.tab.url, "https://docs.example.com/a");
  assert.equal(activity.tab.domain, "docs.example.com");
  assert.equal(activity.tab.pinned, true);
});

test("stores recent activities in local storage and trims to the newest 100", async () => {
  const local = createArea();
  const sync = createArea();

  for (let index = 0; index < LIMITS.recentActivity + 5; index += 1) {
    await appendActivity(local, createActivity(ACTIVITY_TYPES.activated, {
      tab: { id: index, windowId: 1, title: `Tab ${index}`, url: `https://example.com/${index}` },
      timestamp: index
    }));
  }

  const activities = local.state.get(STORAGE_KEYS.activity);
  assert.equal(activities.length, LIMITS.recentActivity);
  assert.equal(activities[0].timestamp, 5);
  assert.equal(activities.at(-1).timestamp, 104);
  assert.equal(sync.state.has(STORAGE_KEYS.activity), false);
});

test("returns recent active open tabs without duplicate tab ids", async () => {
  const local = createArea();
  await appendActivity(local, createActivity(ACTIVITY_TYPES.activated, {
    tab: { id: 1, windowId: 1, title: "Old", url: "https://a.example" },
    timestamp: 1
  }));
  await appendActivity(local, createActivity(ACTIVITY_TYPES.activated, {
    tab: { id: 2, windowId: 1, title: "Second", url: "https://b.example" },
    timestamp: 2
  }));
  await appendActivity(local, createActivity(ACTIVITY_TYPES.activated, {
    tab: { id: 1, windowId: 1, title: "New", url: "https://a.example/new" },
    timestamp: 3
  }));
  await appendActivity(local, createActivity(ACTIVITY_TYPES.closed, {
    tab: { id: 2, windowId: 1, title: "Second", url: "https://b.example" },
    timestamp: 4
  }));

  const openTabs = [
    toTabSnapshot({ id: 1, windowId: 1, title: "New", url: "https://a.example/new" })
  ];

  const active = await getRecentActiveTabs(local, openTabs, 8);
  assert.deepEqual(active.map((item) => item.tab.tabId), [1]);
  assert.equal(active[0].tab.title, "New");
});

test("returns recent closed activities and clears only closed records", async () => {
  const local = createArea();
  await appendActivity(local, createActivity(ACTIVITY_TYPES.closed, {
    tab: { id: 1, windowId: 1, title: "Closed 1", url: "https://closed.example/1" },
    timestamp: 1
  }));
  await appendActivity(local, createActivity(ACTIVITY_TYPES.activated, {
    tab: { id: 2, windowId: 1, title: "Active", url: "https://active.example" },
    timestamp: 2
  }));
  await appendActivity(local, createActivity(ACTIVITY_TYPES.closed, {
    tab: { id: 3, windowId: 1, title: "Closed 2", url: "https://closed.example/2" },
    timestamp: 3
  }));

  const closed = await getRecentClosedTabs(local, 8);
  assert.deepEqual(closed.map((item) => item.tab.title), ["Closed 2", "Closed 1"]);

  await clearClosedActivities(local);
  assert.deepEqual(local.state.get(STORAGE_KEYS.activity).map((item) => item.type), [
    ACTIVITY_TYPES.activated
  ]);
});
