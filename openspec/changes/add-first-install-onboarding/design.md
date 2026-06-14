## Context

TabTrail 是 Chromium MV3 扩展，当前入口包括 popup、side panel、新标签页工作台和 background service worker。新标签页已通过 `chrome_url_overrides.newtab` 替换为 TabTrail 工作台，适合作为首次安装后的引导承载页面。

本设计采用用户已确认的方案 A：安装后自动打开新标签页引导。该方案比 popup 引导有更充足空间，也比 side panel 内嵌任务更早触达用户，适合解释 TabTrail 的三个核心入口关系：新标签页用于完整整理，side panel 用于边浏览边整理，popup 用于快速打开侧边栏和找回最近标签。

### Chrome 官方发布流程调研

依据 Chrome 官方文档，扩展发布通常需要先准备扩展文件、在 Chrome Web Store Developer Dashboard 创建条目、上传 zip、填写商店信息、填写隐私与权限披露、选择发布范围并提交审核。官方发布文档还说明可以在安装后用 `runtime.onInstalled` 和 `tabs.create()` 打开扩展页作为 onboarding，而且这种调用示例不需要额外权限。

发布审核相关约束会影响本变更设计：

- Chrome Web Store 审核会检查扩展是否符合开发者计划政策、权限使用、隐私披露和功能描述。
- 扩展必须有清晰、单一、容易理解的用途；TabTrail 的引导必须围绕“标签找回和整理”，不能引入无关营销或导流。
- 权限必须和功能直接相关；首次引导不得为了打开页面新增不必要权限。
- MV3 不允许执行远程托管代码；引导页面必须使用扩展包内 HTML/CSS/JS。
- 如果收集用户数据，必须如实披露。TabTrail 当前承诺不上传标签数据，因此引导不能暗示云端同步或账号能力。
- 新标签页覆盖不能误导用户或修改默认搜索引擎；引导必须清楚说明这是 TabTrail 工作台，不是浏览器默认搜索页。
- 安装体验不能强迫用户完成无关流程；引导必须可跳过，并且完成或跳过后不反复打扰。

## Goals / Non-Goals

**Goals:**

- 首次安装后自动打开 TabTrail 新标签页工作台，并展示一次性引导。
- 用 3 步帮助用户理解整理范围、侧边栏入口和最近关闭恢复。
- 让用户可以直接开始使用或跳过引导。
- 持久记录引导状态，避免每次打开新标签页都重复展示。
- 提供可选的重新查看入口，方便用户之后找回引导。
- 不新增 Chrome Web Store 审核风险：不新增权限、不远程加载代码、不上传数据、不修改默认搜索引擎。
- 用自动化测试覆盖引导状态、安装事件、新标签页展示和合规文案。

**Non-Goals:**

- 不实现账号注册、云端同步或远程配置。
- 不实现多页复杂教程或动画演示。
- 不强制用户完成所有步骤才能使用 TabTrail。
- 不改变现有 `chrome_url_overrides.newtab` 的定位。
- 不新增浏览器默认搜索框或搜索引擎替换能力。
- 不改变现有最近记录、分类、排序和批量关闭行为。

## Decisions

### 决策：使用新标签页工作台承载首次引导

首次安装后 background 在 `runtime.onInstalled` 中识别 `reason === "install"`，设置引导状态为待展示，并打开扩展内的新标签页工作台。新标签页读取状态后展示顶部引导面板。

选择该方案的原因：

- 新标签页已有完整工作台上下文，能展示真实状态和入口，不需要额外页面类型。
- 空间足够解释 3 个核心动作，避免 popup 过度拥挤。
- Chrome 官方文档支持安装后打开扩展页作为 onboarding，且不需要额外权限。

替代方案是在 popup 顶部展示引导卡，打断更小，但用户只有点击扩展图标才会看到，且空间不足以解释 side panel 和 newtab 的关系。另一个替代方案是在 side panel 内嵌任务引导，但用户尚未知道如何打开 side panel 时无法触达。

### 决策：引导状态存储在同步偏好中，但必须可降级

引导状态建议扩展到现有 `preferences` 对象，例如：

- `onboarding.firstInstallGuideStatus`: `pending | completed | skipped`
- `onboarding.firstInstallGuideVersion`: 当前引导版本，例如 `1`
- `onboarding.firstInstallGuideSeenAt`: 首次展示时间戳

使用 sync storage 的好处是同一用户在多设备安装时可减少重复打扰。但如果 sync 写入失败，UI 必须在当前会话内降级处理，不阻塞用户使用，也不抛出未处理错误。实现可以沿用 `savePreferences` 的失败返回模式。

替代方案是使用 local storage，只在本机生效。local 更简单，但用户多设备时可能重复看到。考虑到现有偏好已经使用 sync，优先沿用同一偏好通道。

### 决策：引导为顶部面板，不做阻塞式弹窗

新标签页首次显示一个顶部引导面板，位于 dashboard header 和摘要区域之间。面板包括：

- 标题：“欢迎使用 TabTrail”
- 简短说明：TabTrail 用于整理当前打开标签和找回最近关闭标签。
- 三个步骤：选择范围、打开侧边栏、从最近关闭恢复。
- 操作按钮：“开始使用 TabTrail”“跳过”
- 合规说明：不上传标签数据，不修改默认搜索引擎。

不使用 modal 的原因是 modal 会阻断用户直接查看工作台，且可能被理解为强制流程。顶部面板既能被看到，也允许用户直接使用下方工作台。

### 决策：安装后打开页面必须可控且幂等

`runtime.onInstalled` 只在安装原因是 `install` 时触发打开引导。更新扩展时不得自动打开引导，除非后续变更显式设计“新版功能介绍”。如果 `tabs.create` 不可用或失败，只设置 `pending` 状态；用户下次打开新标签页时仍可看到引导。

这能避免发布更新时打扰老用户，也降低 Chrome Web Store 对误导安装体验的审核风险。

### 决策：引导不新增权限和远程依赖

当前 manifest 已包含 `tabs`、`storage`、`sidePanel`、`sessions`。首次引导不得新增权限。安装后打开扩展内页面使用现有 runtime/tabs 能力即可，所有文案、样式和脚本必须打包在扩展内。

### 决策：发布合规文案进入 UI 和文档

新手引导必须直接说明：

- “你的标签整理数据保存在浏览器本地/同步存储中，TabTrail 不上传标签数据。”
- “TabTrail 新标签页是整理工作台，不会修改默认搜索引擎。”

文档需要补充发布检查点：

- 上传 Chrome Web Store 前执行 `npm run verify` 和 `npm run build`。
- 检查 manifest 权限说明与商店隐私披露一致。
- 检查引导页面没有远程脚本、远程样式或外部追踪。
- 检查安装后只打开一次引导，并可跳过。

## Risks / Trade-offs

- 安装后自动打开页面可能被用户认为打扰 → 仅首次安装触发，页面清楚标记为 TabTrail 引导，并提供跳过。
- sync storage 写入失败可能导致重复展示 → 保存失败时在当前会话内隐藏，引导状态下次可能再出现，但不阻塞使用；状态区提示偏好保存失败。
- Chrome Web Store 审核可能关注新标签页覆盖和搜索误导 → 引导明确说明不修改默认搜索引擎，不提供伪装浏览器搜索框。
- 用户可能误以为标签数据上传云端 → 引导和文档明确“不上传标签数据”，不展示账号、云端、跨设备恢复等未实现能力。
- 安装后打开页面依赖 `tabs.create` → 失败时保留 pending 状态，下次用户打开 newtab 时展示。

## Migration Plan

该变更不需要迁移既有数据。`normalizePreferences` 需要为缺失的 onboarding 字段补默认值。老用户更新后默认状态应为不自动打扰，建议默认 `completed` 或 `skipped`，仅 `runtime.onInstalled` 的 `install` 分支显式写入 `pending`。

实现顺序：

1. 增加 onboarding 偏好结构和测试。
2. 在安装事件中设置 pending 并尝试打开新标签页。
3. 在 newtab 中读取 pending 状态并展示引导面板。
4. 实现完成/跳过写入和重新查看入口。
5. 补充发布合规文档和测试。

回滚方式：移除安装时设置 pending/打开页面逻辑，并让 newtab 不再渲染引导面板；已有 onboarding 偏好字段可保留，不影响现有功能。

## Open Questions

- “重新查看引导”入口放在 popup 还是 newtab 的帮助区域。默认建议放在 newtab，popup 只保持轻量入口。
- 引导版本升级策略是否需要本次实现。默认第一版只记录 `version: 1`，不自动给老用户弹新版介绍。
