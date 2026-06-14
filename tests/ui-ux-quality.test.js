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
