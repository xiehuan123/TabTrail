import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("docs explain new tab dashboard and focus mode browser limits", async () => {
  const install = await readFile("docs/install.md", "utf8");
  const privacy = await readFile("docs/privacy.md", "utf8");

  assert.match(install, /新标签页/);
  assert.match(install, /不能直接隐藏浏览器原生顶部标签栏/);
  assert.match(install, /专注整理/);
  assert.match(privacy, /不修改默认搜索引擎/);
  assert.match(privacy, /最近关闭/);
});
