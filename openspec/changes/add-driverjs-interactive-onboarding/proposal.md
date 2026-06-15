## 背景与动机

TabTrail 已有首次安装引导，但当前体验是静态顶部说明面板，用户仍需要自己把说明和真实控件对应起来。首次使用应在新标签页工作台内通过交互式步骤直接指向搜索、范围、分类、当前列表和最近关闭等核心区域，帮助新用户完成第一轮整理动作。

Driver.js 相比 Intro.js 更适合作为本变更依赖：Driver.js 是 MIT 许可、无依赖、支持原生 JavaScript、可本地打包；Intro.js 免费版本使用 AGPLv3，若不购买商业授权会带来开源合规风险。

## 变更内容

- 将首次安装后的新标签页引导从静态说明面板升级为 Driver.js 驱动的交互式引导。
- 首次安装打开 `src/newtab/newtab.html?onboarding=1` 后，在工作台加载完成且引导状态为 `pending` 时自动启动交互式引导。
- 交互式引导逐步高亮真实控件：欢迎说明、搜索框、当前窗口/全部窗口范围切换、分类区域、当前分类列表、最近关闭区域和重新查看入口。
- 保留可跳过、可完成、可重新查看能力；完成或跳过后沿用现有 onboarding 偏好状态，避免重复自动展示。
- Driver.js 的 JS/CSS 必须随扩展本地打包，不允许 CDN、远程脚本、远程样式或运行时下载。
- 不新增敏感权限，不上传标签数据，不改变新标签页工作台、最近记录、分类、排序和批量关闭数据模型。
- 增加测试和检查，覆盖本地 vendor 资源、无远程代码、首次 `pending` 自动启动、完成/跳过状态写入和重新查看入口。

## 能力范围

### 新增能力

- `local-tour-dependency`: 定义第三方引导库在 MV3 扩展中的许可、本地打包、无远程代码和构建校验要求。

### 修改能力

- `first-install-onboarding`: 首次安装引导从静态面板变更为新标签页内交互式引导，要求自动启动、逐步高亮真实控件、可跳过/完成/重新查看，并保持隐私和发布审核边界。

## 影响范围

- 影响 `package.json` 和构建流程：需要引入 Driver.js 或将其 vendor 化，并确保构建产物包含本地 JS/CSS。
- 影响 `src/newtab/newtab.html`、`src/newtab/newtab.css`、`src/newtab/newtab.js`：需要为交互式引导目标补稳定选择器，初始化 Driver.js，处理完成/跳过/重新查看和状态公告。
- 影响 `src/shared/preferences.js` 相关测试：沿用现有 onboarding 状态，不新增不兼容字段；如需要记录 tour 版本，应保持默认值兼容老用户。
- 影响 `scripts/check.js` 或新增测试：检查不包含 Intro.js、CDN、远程引导资源或 AGPL 依赖。
- 影响 `tests/newtab-ui.test.js`、`tests/background-events.test.js`、`tests/manifest.test.js`、发布检查测试和可能新增的 Driver.js 集成测试。
- 影响 OpenSpec 中 `add-first-install-onboarding` 的验收方向：本变更替代其静态引导 UI，但复用首次安装打开、状态持久化和合规文案约束。
