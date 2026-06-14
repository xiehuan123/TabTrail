## 背景与动机

TabTrail 已经具备 popup、side panel、新标签页仪表盘等主要界面，但最新 UX 审查发现核心交互仍有明显摩擦：范围切换只靠视觉状态表达，关闭标签缺少撤销反馈，动态状态没有稳定读屏公告，拖拽归类和排序缺少完整键盘替代路径。

本变更要把 popup、side panel、newtab 作为一套一致的交互系统重构，让用户能明确知道当前操作范围、放心整理和关闭标签、从误操作中恢复，并能用键盘和辅助技术完成主要任务。

## 变更内容

- 将 side panel 和 newtab 的“当前窗口 / 全部窗口”范围切换重构为一致的分段控件，提供明确语义、当前状态和摘要文案。
- 为 popup、side panel、newtab 增加专用状态公告区域，用于展示保存、失败、空结果、排序、归类、关闭和恢复结果。
- 为关闭已选标签、关闭分类等破坏性操作增加可恢复反馈，包括撤销入口或等价恢复路径；高风险批量关闭继续保留确认。
- 为排序和归类提供不依赖拖拽的键盘路径，包括行内上移/下移、移动到分类、选择后归类等操作。
- 在选择、排序、搜索过滤和列表重渲染后恢复键盘焦点，避免键盘用户丢失当前位置。
- 为图标按钮和符号按钮补充描述性可访问名称，名称必须包含动作和目标标签。
- 修正空状态、分类按钮、禁用态、拖拽目标态中的无效或误导性语义。
- 明确“应用排序”的状态：无改动、有待应用预览、应用成功、应用失败。
- 优化大量标签场景下的输入体验，减少搜索和连续状态变化造成的完整重渲染。
- 增加或更新 UI、模型和无障碍测试，覆盖新的交互契约。

## 能力范围

### 新增能力

- `interaction-state-feedback`: 定义 popup、side panel、newtab 中状态变化、错误、空状态、关闭恢复、排序和归类结果的可见反馈与辅助技术公告要求。
- `keyboard-tab-organization`: 定义标签选择、排序、归类、焦点恢复和非拖拽整理路径的键盘可用性要求。
- `scope-aware-tab-actions`: 定义当前窗口/全部窗口范围如何展示、公告，并在可能影响多个标签的操作前提供保护。

### 修改能力

<!-- 当前仓库没有已归档的 openspec/specs 主线规格，本变更以新增 repo-local 能力规格表达，不修改主线能力。 -->

## 影响范围

- 影响 `src/popup/popup.html`、`src/popup/popup.css`、`src/popup/popup.js` 及 popup UI/模型测试。
- 影响 `src/sidepanel/sidepanel.html`、`src/sidepanel/sidepanel.css`、`src/sidepanel/sidepanel.js`、`src/sidepanel/sidepanel-model.js` 及 side panel 测试。
- 影响 `src/newtab/newtab.html`、`src/newtab/newtab.css`、`src/newtab/newtab.js`、`src/newtab/newtab-model.js` 及 newtab 测试。
- 可能影响共享 UI token 和少量共享交互工具，以保持状态公告、焦点恢复、撤销反馈一致。
- 不增加后端服务、外部埋点、远程数据上传或网页正文读取。
- 不改变新标签页现有隐私边界，不修改浏览器默认搜索引擎、主页或地址栏搜索行为。
