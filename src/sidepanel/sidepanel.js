const groups = document.querySelector("#tab-groups");
const buttons = [...document.querySelectorAll(".scope-button")];

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
  });
});

const empty = document.createElement("p");
empty.className = "empty-state";
empty.textContent = "正在等待标签数据";
groups.replaceChildren(empty);
