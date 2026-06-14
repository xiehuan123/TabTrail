const activeList = document.querySelector("#recent-active-list");
const closedList = document.querySelector("#recent-closed-list");

function renderEmpty(list, text) {
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = text;
  list.replaceChildren(item);
}

renderEmpty(activeList, "还没有最近活跃标签");
renderEmpty(closedList, "还没有最近关闭标签");
