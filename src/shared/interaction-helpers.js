export function createStatusMessage(type, details = {}) {
  switch (type) {
    case "category-assigned":
      return `已将 ${details.count} 个标签归类到 ${details.category}`;
    case "tabs-closed":
      return `已关闭${details.scopeLabel || "当前范围"}中的 ${details.count} 个标签，可从最近关闭恢复`;
    case "sort-pending":
      return `${details.scopeLabel || "当前范围"}有未应用排序`;
    case "sort-applied":
      return `排序已应用到${details.scopeLabel || "当前范围"}`;
    case "error":
      return details.message || "操作失败，请稍后重试";
    default:
      return details.message || "";
  }
}

export function createScopeStatusText({ scopeLabel, openTabCount, visibleTabCount }) {
  return `${scopeLabel}：${openTabCount} 个标签，${visibleTabCount} 个匹配`;
}

export function createFocusKey({ tabId, control }) {
  if (!Number.isInteger(tabId) && typeof tabId !== "string") {
    return null;
  }
  if (!control) {
    return null;
  }
  return {
    tabId: String(tabId),
    control
  };
}

export function captureFocusKey(root = document) {
  const active = root.activeElement;
  if (!active?.dataset?.tabId || !active.dataset.control) {
    return null;
  }
  return createFocusKey({
    tabId: active.dataset.tabId,
    control: active.dataset.control
  });
}

export function restoreFocusByKey(root, focusKey) {
  if (!focusKey) {
    return false;
  }
  const target = root.querySelector(`[data-tab-id="${focusKey.tabId}"][data-control="${focusKey.control}"]`);
  if (typeof target?.focus === "function") {
    target.focus();
    return true;
  }
  return false;
}

export function createDebouncedTask(task, delay = 120) {
  let timer = null;
  return (...args) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      task(...args);
    }, delay);
  };
}
