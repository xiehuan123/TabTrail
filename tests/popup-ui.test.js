import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("popup exposes entry center controls and summaries", async () => {
  const html = await readFile("src/popup/popup.html", "utf8");
  const css = await readFile("src/popup/popup.css", "utf8");

  for (const id of [
    "open-side-panel",
    "side-panel-status",
    "summary-open-tabs",
    "summary-recent-active",
    "summary-recent-closed",
    "action-click-behavior"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  assert.match(css, /\.primary-action/);
  assert.match(css, /\.summary-grid/);
  assert.match(css, /\.tab-time/);
  assert.match(css, /min-height:\s*44px/);
});
