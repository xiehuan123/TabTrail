import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("new tab dashboard exposes workbench regions without search override wording", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");

  for (const id of [
    "dashboard-search",
    "dashboard-open-side-panel",
    "dashboard-scope",
    "dashboard-recent-active",
    "dashboard-recent-closed",
    "dashboard-groups",
    "dashboard-actions"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  assert.doesNotMatch(html, /默认搜索引擎|搜索引擎设置|chrome_settings_overrides/);
  assert.match(css, /\.dashboard-shell/);
  assert.match(css, /\.dashboard-layout/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
  assert.match(css, /min-height:\s*44px/);
});
