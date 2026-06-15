import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("release docs cover Chrome Web Store onboarding review checks", async () => {
  const docs = [
    await readFile("README.md", "utf8"),
    await readFile("docs/install.md", "utf8"),
    await readFile("docs/privacy.md", "utf8")
  ].join("\n");

  for (const text of [
    "Chrome Web Store",
    "Developer Dashboard",
    "隐私披露",
    "不上传标签数据",
    "不修改默认搜索引擎",
    "远程脚本",
    "交互式",
    "Driver.js",
    "本地打包",
    "首次安装",
    "只展示一次",
    "可跳过"
  ]) {
    assert.match(docs, new RegExp(text));
  }
});

test("manifest permissions stay focused on TabTrail core capabilities", async () => {
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));

  assert.deepEqual(manifest.permissions, ["tabs", "storage", "sidePanel", "sessions"]);
  assert.equal(manifest.chrome_settings_overrides, undefined);
  assert.equal(manifest.content_scripts, undefined);
});

test("Driver.js onboarding assets are local licensed and remote-free", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const html = await readFile("src/newtab/newtab.html", "utf8");
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const tourJs = await readFile("src/newtab/onboarding-tour.js", "utf8");
  const checkJs = await readFile("scripts/check.js", "utf8");

  assert.equal(packageJson.dependencies?.["driver.js"], "1.3.6");
  assert.equal(packageJson.dependencies?.["intro.js"], undefined);
  assert.equal(packageJson.dependencies?.introjs, undefined);

  await access("src/vendor/driverjs/driver.js.iife.js");
  await access("src/vendor/driverjs/driver.css");
  await access("src/vendor/driverjs/LICENSE");

  const license = await readFile("src/vendor/driverjs/LICENSE", "utf8");
  assert.match(license, /MIT License/);

  const source = [html, js, tourJs].join("\n");
  assert.match(source, /\.\.\/vendor\/driverjs\/driver\.js\.iife\.js/);
  assert.match(source, /\.\.\/vendor\/driverjs\/driver\.css/);
  assert.doesNotMatch(source, /https?:\/\/|unpkg|jsdelivr|cdnjs|intro\.js/i);

  for (const text of [
    "driver.js",
    "intro.js",
    "AGPL",
    "unpkg",
    "jsdelivr",
    "cdnjs",
    "https://",
    "http://"
  ]) {
    assert.match(checkJs, new RegExp(text.replace(".", "\\."), "i"));
  }
});

test("project license requires open-sourcing distributed modified versions", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
  const license = await readFile("LICENSE", "utf8");
  const readme = await readFile("README.md", "utf8");

  assert.equal(packageJson.license, "AGPL-3.0-or-later");
  assert.equal(packageLock.packages?.[""]?.license, "AGPL-3.0-or-later");
  assert.match(license, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.match(license, /Version 3, 19 November 2007/);

  for (const text of [
    "AGPL-3.0-or-later",
    "改版",
    "开源",
    "对应源码",
    "Driver.js"
  ]) {
    assert.match(readme, new RegExp(text));
  }
});
