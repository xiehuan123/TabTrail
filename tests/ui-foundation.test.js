import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createRelativeTimeTicker,
  formatRelativeTime,
  getFullTimeText,
  RELATIVE_TIME_REFRESH_MS
} from "../src/shared/time-format.js";
import { ICON_NAMES, renderIcon } from "../src/shared/icons.js";

test("formats recent timestamps for Chinese relative time", () => {
  const now = new Date(2026, 5, 14, 18, 36, 30).getTime();

  assert.equal(formatRelativeTime(new Date(2026, 5, 14, 18, 36, 5).getTime(), now), "刚刚");
  assert.equal(formatRelativeTime(new Date(2026, 5, 14, 18, 31, 0).getTime(), now), "5 分钟前");
  assert.equal(formatRelativeTime(new Date(2026, 5, 14, 9, 8, 0).getTime(), now), "今天 09:08");
  assert.equal(formatRelativeTime(new Date(2026, 5, 13, 22, 7, 0).getTime(), now), "昨天 22:07");
  assert.equal(formatRelativeTime(new Date(2026, 4, 2, 7, 6, 0).getTime(), now), "05-02 07:06");
});

test("formats invalid and precise timestamps predictably", () => {
  const timestamp = new Date(2026, 5, 14, 18, 36, 5).getTime();

  assert.equal(formatRelativeTime(undefined, timestamp), "时间未知");
  assert.equal(formatRelativeTime("bad", timestamp), "时间未知");
  assert.equal(getFullTimeText(undefined), "");
  assert.equal(getFullTimeText(timestamp), "2026-06-14 18:36:05");
});

test("creates a minute ticker for refreshing relative time labels", () => {
  const calls = [];
  const scheduler = {
    setInterval(callback, delay) {
      calls.push(["setInterval", delay]);
      callback();
      return 42;
    },
    clearInterval(handle) {
      calls.push(["clearInterval", handle]);
    }
  };

  const stop = createRelativeTimeTicker(() => calls.push(["tick"]), scheduler);
  stop();

  assert.equal(RELATIVE_TIME_REFRESH_MS, 60_000);
  assert.deepEqual(calls, [
    ["setInterval", 60_000],
    ["tick"],
    ["clearInterval", 42]
  ]);
});

test("renders accessible shared SVG icons", () => {
  assert.ok(ICON_NAMES.includes("panel"));
  assert.match(renderIcon("panel", { label: "打开侧边栏" }), /aria-label="打开侧边栏"/);
  assert.match(renderIcon("clock"), /aria-hidden="true"/);
  assert.throws(() => renderIcon("missing"), /Unknown icon/);
});

test("shared UI tokens are imported by popup and side panel styles", async () => {
  const tokens = await readFile("src/shared/ui-tokens.css", "utf8");
  const popupCss = await readFile("src/popup/popup.css", "utf8");
  const sidePanelCss = await readFile("src/sidepanel/sidepanel.css", "utf8");

  for (const token of [
    "--tt-color-bg",
    "--tt-color-surface",
    "--tt-color-primary",
    "--tt-focus-ring",
    "--tt-motion-fast"
  ]) {
    assert.match(tokens, new RegExp(token));
  }

  assert.match(popupCss, /@import url\("\.\.\/shared\/ui-tokens\.css"\);/);
  assert.match(sidePanelCss, /@import url\("\.\.\/shared\/ui-tokens\.css"\);/);
});
