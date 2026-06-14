import assert from "node:assert/strict";
import test from "node:test";

import { STORAGE_KEYS } from "../src/shared/constants.js";
import {
  DEFAULT_PREFERENCES,
  getTabTrailState,
  readPreferences,
  savePreferences
} from "../src/shared/preferences.js";

function createArea({ failSet = false } = {}) {
  const state = new Map();

  return {
    state,
    async get(key) {
      return { [key]: state.get(key) };
    },
    async set(values) {
      if (failSet) {
        throw new Error("sync unavailable");
      }
      for (const [key, value] of Object.entries(values)) {
        state.set(key, value);
      }
    }
  };
}

test("reads default preferences when sync storage is empty", async () => {
  const sync = createArea();

  const preferences = await readPreferences(sync);

  assert.deepEqual(preferences, DEFAULT_PREFERENCES);
});

test("saves lightweight preferences to sync storage only", async () => {
  const sync = createArea();
  const next = {
    ...DEFAULT_PREFERENCES,
    manualCategories: { "12": "工作" },
    pinnedKeys: ["https://example.com/a"],
    previewOrders: { "window:1": [3, 2, 1] },
    defaultScope: "all-windows"
  };

  const result = await savePreferences(sync, next);

  assert.equal(result.ok, true);
  assert.deepEqual(sync.state.get(STORAGE_KEYS.preferences), next);
  assert.equal(sync.state.has(STORAGE_KEYS.activity), false);
});

test("returns local activity and sync preferences as separate state", async () => {
  const local = createArea();
  const sync = createArea();
  const activity = [{ id: "a", type: "activated" }];
  const preferences = {
    ...DEFAULT_PREFERENCES,
    pinnedKeys: ["tab:1"]
  };
  await local.set({ [STORAGE_KEYS.activity]: activity });
  await sync.set({ [STORAGE_KEYS.preferences]: preferences });

  const state = await getTabTrailState({ local, sync });

  assert.deepEqual(state.activities, activity);
  assert.deepEqual(state.preferences, preferences);
});

test("sync write failures do not throw and report degraded persistence", async () => {
  const sync = createArea({ failSet: true });

  const result = await savePreferences(sync, {
    ...DEFAULT_PREFERENCES,
    defaultScope: "all-windows"
  });

  assert.equal(result.ok, false);
  assert.match(result.error.message, /sync unavailable/);
});
