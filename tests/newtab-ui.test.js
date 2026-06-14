import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("new tab dashboard exposes category-first regions without side panel entry", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");

  for (const id of [
    "dashboard-search",
    "dashboard-scope",
    "dashboard-category-grid",
    "dashboard-category-name",
    "dashboard-assign-category",
    "dashboard-current-category",
    "dashboard-current-list",
    "dashboard-recent-active",
    "dashboard-recent-closed",
    "dashboard-actions"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  assert.doesNotMatch(html, /id="dashboard-open-side-panel"|打开侧边栏/);
  assert.doesNotMatch(html, /默认搜索引擎|搜索引擎设置|chrome_settings_overrides/);
  assert.match(css, /\.dashboard-shell/);
  assert.match(css, /\.category-grid/);
  assert.match(css, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(160px,\s*1fr\)\)/);
  assert.match(css, /\.current-category-panel/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
  assert.match(css, /min-height:\s*44px/);
});

test("new tab dashboard exposes focus mode guidance", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");

  assert.match(html, /id="dashboard-focus-mode"/);
  assert.match(html, /不能直接隐藏浏览器原生顶部标签栏/);
  assert.match(html, /关闭后可从最近关闭重新打开/);
});

test("new tab dashboard wires category assignment and drag targets", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");

  for (const pattern of [
    /assignCategoryToTabs/,
    /assignDashboardTabToCategory/,
    /addEventListener\("click", async \(\) =>/,
    /addEventListener\("dragstart"/,
    /addEventListener\("dragover"/,
    /addEventListener\("drop"/,
    /addEventListener\("dragenter"/,
    /addEventListener\("dragleave"/,
    /dataset\.canReceiveDrop/,
    /aria-disabled/
  ]) {
    assert.match(js, pattern);
  }

  assert.match(css, /\.category-button\.can-drop/);
  assert.match(css, /\.category-button\.is-drop-target/);
  assert.match(css, /\.tab-row\[draggable="true"\]/);
});

test("new tab dashboard wires close current category action", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");

  assert.match(html, /id="dashboard-close-category"/);
  assert.match(js, /closeDashboardCategory/);
  assert.match(js, /closeCategoryButton\.hidden = !category\.canClose/);
  assert.match(js, /确定关闭分类「\$\{categoryTitle\}」中的 \$\{count\} 个标签/);
  assert.match(js, /category\.id === "all"/);
  assert.match(js, /category\.readOnly/);
  assert.match(css, /\.close-category-action/);
});
