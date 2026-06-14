import assert from "node:assert/strict";
import test from "node:test";

import {
  createDebouncedTask,
  createFocusKey,
  createScopeStatusText,
  createStatusMessage
} from "../src/shared/interaction-helpers.js";

test("creates concise status messages for success error and recovery states", () => {
  assert.equal(createStatusMessage("category-assigned", { count: 3, category: "工作" }), "已将 3 个标签归类到 工作");
  assert.equal(createStatusMessage("tabs-closed", { count: 2, scopeLabel: "当前窗口" }), "已关闭当前窗口中的 2 个标签，可从最近关闭恢复");
  assert.equal(createStatusMessage("sort-pending", { scopeLabel: "全部窗口" }), "全部窗口有未应用排序");
  assert.equal(createStatusMessage("sort-applied", { scopeLabel: "当前窗口" }), "排序已应用到当前窗口");
  assert.equal(createStatusMessage("error", { message: "无法读取标签数据" }), "无法读取标签数据");
});

test("creates scope status text with scope label and counts", () => {
  assert.equal(createScopeStatusText({
    scopeLabel: "当前窗口",
    openTabCount: 12,
    visibleTabCount: 5
  }), "当前窗口：12 个标签，5 个匹配");
});

test("creates stable focus keys from tab id and control name", () => {
  assert.deepEqual(createFocusKey({ tabId: 42, control: "select" }), {
    tabId: "42",
    control: "select"
  });
  assert.equal(createFocusKey({ tabId: null, control: "select" }), null);
});

test("debounced task runs only the latest scheduled operation", async () => {
  const calls = [];
  const debounce = createDebouncedTask((value) => calls.push(value), 5);

  debounce("first");
  debounce("second");
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.deepEqual(calls, ["second"]);
});
