import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("release metadata is ready for version 0.2.0", async () => {
  const manifest = await readJson("manifest.json");
  const packageJson = await readJson("package.json");

  assert.equal(manifest.version, "0.2.0");
  assert.equal(packageJson.version, "0.2.0");
  assert.equal(manifest.version, packageJson.version);
});

test("test script only discovers committed repository tests", async () => {
  const packageJson = await readJson("package.json");

  assert.equal(packageJson.scripts.test, "node --test tests");
});

test("README explains installation features permissions privacy limits and usage in Chinese", async () => {
  const readme = await readFile("README.md", "utf8");

  for (const text of [
    "TabTrail",
    "安装",
    "新标签页仪表盘",
    "侧边栏",
    "分类整理",
    "最近活跃",
    "最近关闭",
    "批量关闭",
    "关闭分类",
    "拖拽",
    "tabs",
    "storage",
    "sidePanel",
    "sessions",
    "不上传",
    "不读取网页正文",
    "不能直接隐藏浏览器原生顶部标签栏",
    "不修改默认搜索引擎",
    "默认新标签页",
    "禁用扩展"
  ]) {
    assert.match(readme, new RegExp(text));
  }
});
