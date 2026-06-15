import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  popupHtml: "src/popup/popup.html",
  popupCss: "src/popup/popup.css",
  popupJs: "src/popup/popup.js",
  sidepanelHtml: "src/sidepanel/sidepanel.html",
  sidepanelCss: "src/sidepanel/sidepanel.css",
  sidepanelJs: "src/sidepanel/sidepanel.js",
  newtabHtml: "src/newtab/newtab.html",
  newtabCss: "src/newtab/newtab.css",
  newtabJs: "src/newtab/newtab.js",
  tokensCss: "src/shared/ui-tokens.css"
};

async function readAll() {
  return Object.fromEntries(
    await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, "utf8")]))
  );
}

test("major surfaces expose loading empty error and confirmation states", async () => {
  const source = Object.values(await readAll()).join("\n");

  for (const text of [
    "正在检查",
    "还没有",
    "无法读取",
    "确定关闭",
    "关闭 3 个及以上标签前会再次确认"
  ]) {
    assert.match(source, new RegExp(text));
  }
});

test("interactive controls have accessible labels and 44px targets", async () => {
  const { popupHtml, sidepanelHtml, newtabHtml, popupCss, sidepanelCss, newtabCss } = await readAll();
  const html = [popupHtml, sidepanelHtml, newtabHtml].join("\n");
  const css = [popupCss, sidepanelCss, newtabCss].join("\n");

  for (const label of [
    'aria-label="当前状态摘要"',
    'aria-label="整理状态"',
    'aria-label="批量操作"',
    'aria-label="整理操作"'
  ]) {
    assert.match(html, new RegExp(label));
  }

  const minTargetCount = [...css.matchAll(/min-height:\s*44px/g)].length;
  assert.ok(minTargetCount >= 10, `expected at least 10 44px target declarations, saw ${minTargetCount}`);
});

test("responsive and reduced motion rules are present", async () => {
  const { popupCss, sidepanelCss, newtabCss, tokensCss } = await readAll();
  const css = [popupCss, sidepanelCss, newtabCss, tokensCss].join("\n");

  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
  assert.match(css, /@media \(max-width:\s*1023px\)/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test("semantic status colors and focus ring tokens are used", async () => {
  const { popupCss, sidepanelCss, newtabCss, tokensCss } = await readAll();
  const css = [popupCss, sidepanelCss, newtabCss, tokensCss].join("\n");

  for (const token of [
    "--tt-color-danger",
    "--tt-color-warning",
    "--tt-color-success",
    "--tt-focus-ring"
  ]) {
    assert.match(css, new RegExp(token));
  }
});

test("new tab category dashboard exposes accessible states and safe actions", async () => {
  const { newtabHtml, newtabCss, newtabJs } = await readAll();

  assert.match(newtabHtml, /aria-label="标签分类"/);
  assert.match(newtabHtml, /id="dashboard-close-category"/);
  assert.match(newtabJs, /setAttribute\("aria-label", `分类 \$\{category\.title\}，\$\{category\.count\} 个标签`\)/);
  assert.doesNotMatch(newtabJs, /setAttribute\("aria-disabled", "true"\)/);
  assert.match(newtabJs, /确定关闭分类「\$\{categoryTitle\}」中的 \$\{count\} 个标签/);
  assert.doesNotMatch(newtabCss, /\.category-button\[aria-disabled="true"\]/);
  assert.match(newtabCss, /\.category-button\.is-drop-target/);
  assert.match(newtabCss, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(160px,\s*1fr\)\)/);
});

test("major surfaces use dedicated status announcements instead of live list regions", async () => {
  const { popupHtml, sidepanelHtml, newtabHtml } = await readAll();

  for (const html of [popupHtml, sidepanelHtml, newtabHtml]) {
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /aria-atomic="true"/);
  }

  assert.doesNotMatch(sidepanelHtml, /id="tab-groups"[^>]*aria-live/);
  assert.doesNotMatch(newtabHtml, /id="dashboard-current-list"[^>]*aria-live/);
});

test("scope controls use segmented button semantics instead of incomplete tablists", async () => {
  const { sidepanelHtml, sidepanelJs, newtabHtml, newtabJs } = await readAll();

  assert.doesNotMatch(sidepanelHtml, /class="scope-switch" role="tablist"/);
  assert.doesNotMatch(newtabHtml, /class="scope-switch" role="tablist"/);
  assert.match(sidepanelHtml, /aria-label="标签范围"/);
  assert.match(newtabHtml, /aria-label="标签范围"/);
  assert.match(sidepanelHtml, /aria-pressed="true"/);
  assert.match(newtabHtml, /aria-pressed="true"/);
  assert.match(sidepanelJs, /setAttribute\("aria-pressed"/);
  assert.match(newtabJs, /setAttribute\("aria-pressed"/);
});

test("tab organization surfaces expose keyboard alternatives and focus restoration hooks", async () => {
  const { sidepanelJs, newtabJs } = await readAll();

  assert.match(sidepanelJs, /captureFocusKey/);
  assert.match(sidepanelJs, /restoreFocusByKey/);
  assert.match(newtabJs, /captureFocusKey/);
  assert.match(newtabJs, /restoreFocusByKey/);
  assert.match(newtabJs, /move-category/);
  assert.match(newtabJs, /移动到分类/);
  assert.match(newtabJs, /move-up/);
  assert.match(newtabJs, /move-down/);
  assert.match(newtabJs, /将 \$\{tab\.title\} 上移/);
  assert.match(newtabJs, /将 \$\{tab\.title\} 下移/);
});

test("close and sort actions expose recovery and pending-state feedback", async () => {
  const { sidepanelJs, newtabJs } = await readAll();

  assert.match(sidepanelJs, /可从最近关闭恢复/);
  assert.match(newtabJs, /可从最近关闭恢复/);
  assert.match(sidepanelJs, /hasPendingOrder/);
  assert.match(newtabJs, /hasPendingOrder/);
  assert.match(sidepanelJs, /有未应用排序/);
  assert.match(newtabJs, /有未应用排序/);
});

test("first install onboarding is accessible and publish-compliance aware", async () => {
  const { newtabHtml, newtabCss, newtabJs } = await readAll();
  const source = [newtabHtml, newtabCss, newtabJs].join("\n");

  assert.match(newtabHtml, /id="first-install-onboarding"/);
  assert.match(newtabHtml, /aria-labelledby="onboarding-title"/);
  assert.match(newtabHtml, /role="status"/);
  assert.match(newtabHtml, /不上传标签数据/);
  assert.match(newtabHtml, /不会修改默认搜索引擎/);
  assert.match(newtabHtml, /跳过/);
  assert.match(newtabHtml, /重新查看新手引导/);
  assert.match(newtabCss, /\.onboarding-panel/);
  assert.match(newtabCss, /\.tabtrail-driver-popover/);
  assert.match(newtabCss, /min-height:\s*44px/);
  assert.doesNotMatch(source, /https?:\/\/|chrome_settings_overrides|默认搜索框/);
});

test("first install onboarding uses stable Driver.js targets without remote resources", async () => {
  const { newtabHtml, newtabJs } = await readAll();
  const tourJs = await readFile("src/newtab/onboarding-tour.js", "utf8");
  const source = [newtabHtml, newtabJs, tourJs].join("\n");

  for (const target of [
    "welcome",
    "search",
    "scope",
    "categories",
    "current-list",
    "recent-closed",
    "reopen"
  ]) {
    assert.match(newtabHtml, new RegExp(`data-onboarding-target="${target}"`));
  }

  assert.match(newtabHtml, /src="\.\.\/vendor\/driverjs\/driver\.js\.iife\.js"/);
  assert.match(newtabHtml, /href="\.\.\/vendor\/driverjs\/driver\.css"/);
  assert.match(tourJs, /const tour = driverFactory\(\{/);
  assert.match(tourJs, /showProgress:\s*true/);
  assert.doesNotMatch(source, /https?:\/\/|unpkg|jsdelivr|cdnjs|intro\.js/i);
});
