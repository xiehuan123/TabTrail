import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, STORAGE_KEYS } from "../src/shared/constants.js";
import { handleTabRemoved } from "../src/background/tab-events.js";

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

test("records a closed tab from cache when available", async () => {
  const local = createArea();
  const cache = new Map([
    [7, { id: 7, windowId: 1, title: "Cached", url: "https://cached.example" }]
  ]);

  await handleTabRemoved({
    tabId: 7,
    tabCache: cache,
    localArea: local
  });

  const [activity] = local.state.get(STORAGE_KEYS.activity);
  assert.equal(activity.type, ACTIVITY_TYPES.closed);
  assert.equal(activity.tab.title, "Cached");
  assert.equal(cache.has(7), false);
});

test("uses sessions recently closed fallback when tab cache is empty", async () => {
  const local = createArea();
  const sessionsApi = {
    async getRecentlyClosed() {
      return [{
        tab: {
          id: 42,
          windowId: 9,
          title: "Fallback",
          url: "https://fallback.example"
        }
      }];
    }
  };

  await handleTabRemoved({
    tabId: 42,
    tabCache: new Map(),
    localArea: local,
    sessionsApi
  });

  const [activity] = local.state.get(STORAGE_KEYS.activity);
  assert.equal(activity.type, ACTIVITY_TYPES.closed);
  assert.equal(activity.tab.title, "Fallback");
});
