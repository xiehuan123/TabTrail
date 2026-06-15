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

  assert.doesNotMatch(html, /id="dashboard-open-side-panel"/);
  assert.doesNotMatch(html, /搜索引擎设置|chrome_settings_overrides/);
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

test("new tab dashboard exposes first install onboarding without blocking the workbench", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");

  for (const id of [
    "first-install-onboarding",
    "onboarding-start",
    "onboarding-skip",
    "onboarding-reopen"
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  for (const text of [
    "欢迎使用 TabTrail",
    "选择整理范围",
    "打开侧边栏",
    "从最近关闭恢复",
    "不上传标签数据",
    "不会修改默认搜索引擎"
  ]) {
    assert.match(html, new RegExp(text));
  }

  assert.match(html, /hidden/);
  assert.match(css, /\.onboarding-panel/);
  assert.match(css, /\.onboarding-steps/);
  assert.match(css, /#onboarding-reopen/);
  assert.match(css, /@media \(max-width:\s*767px\)/);
});

test("new tab dashboard wires Driver.js interactive onboarding with stable targets", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const tourJs = await readFile("src/newtab/onboarding-tour.js", "utf8");

  assert.match(html, /href="\.\.\/vendor\/driverjs\/driver\.css"/);
  assert.match(html, /src="\.\.\/vendor\/driverjs\/driver\.js\.iife\.js"/);
  assert.match(js, /import \{ createOnboardingTour \} from "\.\/onboarding-tour\.js"/);

  for (const target of [
    "welcome",
    "search",
    "scope",
    "categories",
    "current-list",
    "recent-closed",
    "reopen"
  ]) {
    assert.match(html, new RegExp(`data-onboarding-target="${target}"`));
  }

  for (const pattern of [
    /globalThis\.driver\?\.js\?\.driver/,
    /createOnboardingTour/,
    /onComplete/,
    /onSkip/,
    /onUnavailable/,
    /allowKeyboardControl:\s*true/,
    /progressText:\s*"{{current}} \/ {{total}}"/,
    /doneBtnText:\s*"完成"/,
    /nextBtnText:\s*"下一步"/,
    /prevBtnText:\s*"上一步"/
  ]) {
    assert.match(tourJs, pattern);
  }

  assert.match(css, /\.tabtrail-driver-popover/);
  assert.match(css, /\.driver-popover/);
});

test("new tab dashboard wires onboarding state transitions", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");

  for (const pattern of [
    /markOnboardingCompleted/,
    /markOnboardingSkipped/,
    /firstInstallGuideStatus === "pending"/,
    /startOnboardingTour/,
    /createOnboardingTour/,
    /onboardingStart/,
    /onboardingSkip/,
    /onboardingReopen/,
    /showOnboarding/,
    /hideOnboarding/
  ]) {
    assert.match(js, pattern);
  }
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
    /move-category/
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
