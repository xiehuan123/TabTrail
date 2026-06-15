## 背景

TabTrail 目前是无框架 Chromium MV3 扩展，前端由扩展包内的 HTML/CSS/ES modules 组成，构建脚本只是复制 `manifest.json` 和 `src/` 到 `dist/`。已有 `add-first-install-onboarding` 变更实现了首次安装后打开新标签页工作台、保存 onboarding 状态、展示一次性顶部引导面板，并说明不上传标签数据和不修改默认搜索引擎。

这次变更把静态说明升级为新标签页内的交互式引导。用户已确认选择 Driver.js。调研结论：

- Driver.js 支持 npm 安装、本地 import、单步高亮和多步骤引导，适合原生 JavaScript。
- Driver.js 仓库/文档标注 MIT 许可，且无运行时框架依赖，许可风险低于 Intro.js 免费版的 AGPLv3。
- Chrome MV3 扩展必须把执行逻辑放在扩展包内；引导库和样式不得从 CDN 或远程地址加载。

## 目标 / 非目标

**目标：**

- 首次安装后在 `src/newtab/newtab.html?onboarding=1` 中自动启动 Driver.js 交互式引导。
- 让引导逐步高亮真实 UI 区域，而不是只展示静态说明。
- 沿用现有 onboarding 状态：`pending` 自动展示，完成/跳过后不重复展示，重新查看入口可手动启动。
- 将 Driver.js 作为本地打包依赖，保留 MIT 许可信息，禁止 CDN 和运行时下载。
- 保持 MV3、Chrome Web Store、隐私和新标签页覆盖约束：不新增无关权限、不上传标签数据、不修改默认搜索引擎。
- 增加自动化测试和结构检查，防止误引入 Intro.js、AGPL 依赖或远程引导资源。

**非目标：**

- 不重新设计整个新标签页工作台。
- 不引入 React、Vue、构建器或大型前端框架。
- 不实现账号、云同步、远程配置或 A/B 实验。
- 不强制用户完成交互式引导才能使用工作台。
- 不在 popup 或 side panel 自动弹出交互式引导；本次只覆盖新标签页首次使用。

## 设计决策

### 决策：使用 Driver.js 而不是 Intro.js

Driver.js 作为本次交互式引导库。原因是它是 MIT 许可、无依赖、适配当前原生 JS 结构，并支持多步骤高亮、弹出说明、进度和完成/跳过回调。Intro.js 功能也符合需求，但免费版 AGPLv3 会给闭源或商业发布带来合规风险；除非购买商业授权，否则不作为默认依赖。

### 决策：本地 vendor 化或 npm 后复制，不使用 CDN

实现可以使用两种等价路径之一：

1. 在 `package.json` 增加 `driver.js` 依赖，并更新构建脚本把 `node_modules/driver.js/dist/driver.js.iife.js` 和 `driver.css` 复制到 `src/vendor/driverjs/` 或 `dist/src/vendor/driverjs/`。
2. 直接将明确版本的 Driver.js dist 文件和 MIT license vendor 到 `src/vendor/driverjs/`。

推荐路径是 npm 依赖加构建复制，因为版本来源清晰，便于升级和审计。无论采用哪种路径，扩展页面都只能引用扩展包内资源。测试和 `scripts/check.js` 需要禁止 `https://`、`http://`、`unpkg`、`jsdelivr`、`cdnjs` 等远程资源出现在 onboarding 相关 HTML/JS/CSS 中。

### 决策：保留轻量静态说明作为 no-JS/初始化兜底，交互式引导为主体验

当前 `#first-install-onboarding` 可改造成交互式引导的欢迎区域和兜底说明。正常情况下 Driver.js 启动后逐步高亮真实控件；如果 Driver.js 加载失败或目标元素缺失，页面仍显示简短面板并允许“开始使用 TabTrail”或“跳过”，避免首次体验卡死。

### 决策：引导步骤绑定稳定 data 属性

新标签页中需要为引导目标补稳定选择器，例如：

- `[data-onboarding-target="welcome"]`
- `[data-onboarding-target="search"]`
- `[data-onboarding-target="scope"]`
- `[data-onboarding-target="categories"]`
- `[data-onboarding-target="current-list"]`
- `[data-onboarding-target="recent-closed"]`
- `[data-onboarding-target="reopen"]`

避免绑定易变 class 或文本。动态区域为空时仍必须有可高亮容器；如果个别目标不可用，初始化逻辑要跳过该步骤或回退到欢迎面板。

### 决策：状态写入由引导回调统一处理

当 `preferences.onboarding.firstInstallGuideStatus === "pending"` 且页面完成首轮渲染后，自动启动交互式引导。Driver.js 的完成、关闭和销毁回调需要映射到现有状态：

- 用户点击完成或最后一步结束：调用 `markOnboardingCompleted`。
- 用户点击跳过/关闭：调用 `markOnboardingSkipped`。
- 用户点击“重新查看新手引导”：启动交互式引导，但不自动改变已完成或已跳过状态；只有用户在引导中明确完成/跳过时才可再次写入对应状态。

保存失败时沿用现有降级策略：当前页面隐藏或结束交互式引导，并通过 `#dashboard-message` 公告“状态无法同步保存”，不阻塞工作台使用。

### 决策：文案保持短句和审核边界

每一步弹出说明只说明当前控件能做什么，不做营销式长文案。欢迎/结束步骤必须包含两条边界：TabTrail 不上传标签数据；新标签页是整理工作台，不修改默认搜索引擎。

## 风险 / 取舍

- 第三方库增加包体和样式冲突风险 -> 固定 Driver.js 版本，保留 license，限制覆盖 CSS 到 `driver-popover`/Driver.js 类名，运行窄宽度检查。
- 引导目标随 UI 改动失效 -> 使用 `data-onboarding-target`，增加测试检查目标存在，并让初始化跳过缺失目标。
- 用户关闭引导后重复弹出 -> 关闭/跳过必须写入 `skipped`；`pending` 只在首次安装或明确重新查看时触发。
- MV3 审核关注远程代码 -> 所有 Driver.js 资源本地打包，检查脚本禁止 CDN 和远程脚本。
- 无障碍体验比原生面板复杂 -> 保留可见兜底面板、按钮可聚焦、状态公告可读；手动键盘走查必须覆盖引导前进、后退、跳过、完成。

## 迁移计划

1. 固定 Driver.js 获取方式，并加入本地 vendor 资源和 license。
2. 修改构建和检查脚本，确保 `dist/` 包含 Driver.js 本地资源，且没有远程引导资源。
3. 在 newtab HTML 中补稳定引导目标和必要兜底文案。
4. 在 newtab JS 中新增 Driver.js 初始化模块或函数，接入现有 onboarding 状态和完成/跳过保存逻辑。
5. 调整 CSS，保证 Driver.js popover 在桌面、窄屏和 200% 缩放下不遮挡关键操作。
6. 更新测试并运行 `npm test`、`npm run check`、`npm run build`。

回滚方式：移除 Driver.js 资源引用和初始化逻辑，恢复静态 `#first-install-onboarding` 面板。既有 onboarding 偏好字段无需迁移或删除。

## 待确认问题

- Driver.js 资源采用 npm 构建复制还是直接 vendor dist 文件。默认推荐 npm 依赖加构建复制；如果当前环境不能下载依赖，可暂时 vendor 固定版本文件。
- 是否在完成引导后自动聚焦搜索框。默认建议聚焦搜索框，帮助用户立即开始整理。
