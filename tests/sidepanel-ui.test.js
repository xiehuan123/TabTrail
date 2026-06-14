import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("side panel exposes workbench layout regions", async () => {
  const html = await readFile("src/sidepanel/sidepanel.html", "utf8");
  const css = await readFile("src/sidepanel/sidepanel.css", "utf8");

  for (const id of [
    "panel-status",
    "panel-tools",
    "recent-active-panel",
    "recent-closed-panel",
    "panel-actions",
    "summary-open-tabs",
    "summary-visible-tabs",
    "summary-recent-closed"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  assert.match(css, /\.panel-workbench/);
  assert.match(css, /\.status-grid/);
  assert.match(css, /\.recent-grid/);
  assert.match(css, /\.panel-actions/);
  assert.match(css, /min-height:\s*44px/);
});

test("side panel explains focus mode browser boundaries", async () => {
  const html = await readFile("src/sidepanel/sidepanel.html", "utf8");

  assert.match(html, /id="focus-mode-panel"/);
  assert.match(html, /不能直接隐藏浏览器原生顶部标签栏/);
  assert.match(html, /关闭 3 个及以上标签前会再次确认/);
  assert.match(html, /最近关闭/);
});
