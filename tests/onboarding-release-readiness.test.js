import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
