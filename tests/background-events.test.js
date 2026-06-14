import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, STORAGE_KEYS } from "../src/shared/constants.js";
import { handleTabRemoved } from "../src/background/tab-events.js";
import { handleInstalled } from "../src/background/install-events.js";

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

test("first install marks onboarding pending and opens the new tab guide", async () => {
  const sync = createArea();
  const opened = [];

  const result = await handleInstalled({
    reason: "install",
    syncArea: sync,
    tabsApi: {
      async create(details) {
        opened.push(details);
      }
    },
    sidePanelApi: {
      async setPanelBehavior() {}
    },
    runtimeApi: {
      getURL(path) {
        return `chrome-extension://tabtrail/${path}`;
      }
    },
    now: Date.UTC(2026, 5, 14)
  });

  assert.equal(result.onboardingOpened, true);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].url, "chrome-extension://tabtrail/src/newtab/newtab.html?onboarding=1");
  assert.equal(sync.state.get(STORAGE_KEYS.preferences).onboarding.firstInstallGuideStatus, "pending");
});

test("extension update configures side panel without opening onboarding", async () => {
  const sync = createArea();
  const opened = [];
  let behavior = null;

  const result = await handleInstalled({
    reason: "update",
    syncArea: sync,
    tabsApi: {
      async create(details) {
        opened.push(details);
      }
    },
    sidePanelApi: {
      async setPanelBehavior(details) {
        behavior = details;
      }
    },
    runtimeApi: {
      getURL(path) {
        return `chrome-extension://tabtrail/${path}`;
      }
    }
  });

  assert.equal(result.onboardingOpened, false);
  assert.deepEqual(opened, []);
  assert.deepEqual(behavior, { openPanelOnActionClick: false });
  assert.equal(sync.state.has(STORAGE_KEYS.preferences), false);
});

test("first install keeps onboarding pending if opening the tab fails", async () => {
  const sync = createArea();

  const result = await handleInstalled({
    reason: "install",
    syncArea: sync,
    tabsApi: {
      async create() {
        throw new Error("tabs unavailable");
      }
    },
    sidePanelApi: {
      async setPanelBehavior() {}
    },
    runtimeApi: {
      getURL(path) {
        return `chrome-extension://tabtrail/${path}`;
      }
    }
  });

  assert.equal(result.onboardingOpened, false);
  assert.match(result.openError.message, /tabs unavailable/);
  assert.equal(sync.state.get(STORAGE_KEYS.preferences).onboarding.firstInstallGuideStatus, "pending");
});

test("first install continues onboarding when side panel setup fails", async () => {
  const sync = createArea();
  const opened = [];

  const result = await handleInstalled({
    reason: "install",
    syncArea: sync,
    tabsApi: {
      async create(details) {
        opened.push(details);
      }
    },
    sidePanelApi: {
      async setPanelBehavior() {
        throw new Error("side panel unavailable");
      }
    },
    runtimeApi: {
      getURL(path) {
        return `chrome-extension://tabtrail/${path}`;
      }
    }
  });

  assert.equal(result.onboardingOpened, true);
  assert.match(result.sidePanelError.message, /side panel unavailable/);
  assert.equal(opened.length, 1);
  assert.equal(sync.state.get(STORAGE_KEYS.preferences).onboarding.firstInstallGuideStatus, "pending");
});
