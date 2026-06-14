## Why

TabTrail 目前已经有 popup、side panel 和新标签页工作台，但第一次安装后用户还不知道三者分别适合做什么，也不知道如何从“刚装好扩展”进入整理流程。首次体验缺少明确路径，会降低用户理解核心价值和完成首个整理动作的概率。

本变更选择方案 A：首次安装后打开 TabTrail 新标签页引导，用一次性、可跳过、可完成的引导解释“当前窗口/全部窗口”“侧边栏整理”“最近关闭恢复”三件核心事情，同时遵守 Chrome Web Store 发布审核对权限、隐私披露、新标签页覆盖和安装体验的要求。

## What Changes

- 新增首次安装引导状态，记录用户是否已经看到、完成或跳过引导。
- 在扩展首次安装时打开 TabTrail 新标签页工作台，并展示一次性新手引导。
- 在新标签页工作台顶部展示 3 步引导：选择整理范围、打开侧边栏、理解最近关闭恢复。
- 提供“开始使用”和“跳过”入口；完成或跳过后不再自动展示。
- 引导文案必须明确 TabTrail 不修改默认搜索引擎、不上传标签数据，并说明新标签页工作台是扩展提供的整理入口。
- popup 或 side panel 可提供低打扰的“重新查看引导”入口，但不强制弹窗。
- 不新增远程代码、后端服务或敏感权限。
- 不改变现有最近活跃、最近关闭、分类、排序和批量关闭的数据模型。

## Capabilities

### New Capabilities

- `first-install-onboarding`: 定义首次安装引导的打开时机、展示内容、完成/跳过状态、重新查看入口、隐私和发布审核约束。

### Modified Capabilities

- `new-tab-dashboard`: 新标签页工作台需要承载首次安装引导，并在引导存在时保持原有整理功能可进入。

## Impact

- 影响 `src/background/service-worker.js`：需要在 `runtime.onInstalled` 的 `reason === "install"` 时打开扩展新标签页或设置引导待展示状态。
- 影响 `src/shared/preferences.js` 或新增共享 onboarding 状态模块：需要读写首次引导状态。
- 影响 `src/newtab/newtab.html`、`src/newtab/newtab.css`、`src/newtab/newtab.js`：需要展示引导面板、处理完成/跳过和重新查看。
- 可能影响 `src/popup` 或 `src/sidepanel`：如果加入“重新查看引导”入口，需要低打扰呈现。
- 影响测试：需要覆盖首次安装事件、引导状态读写、新标签页引导展示、完成/跳过后不再展示、无额外权限和发布合规文案。
- 影响文档：需要在安装说明或发布检查清单中补充首次引导、Chrome Web Store 发布审核注意事项和隐私披露边界。
