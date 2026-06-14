## ADDED Requirements

### Requirement: Popup 提供打开侧边栏入口
TabTrail popup SHALL 提供明确的打开 side panel 入口。

#### Scenario: 用户打开 popup
- **WHEN** 用户点击扩展图标打开 popup
- **THEN** 系统 MUST 展示一个打开 side panel 的主要入口

#### Scenario: 用户点击打开侧边栏
- **WHEN** 用户点击打开 side panel 入口
- **THEN** 系统 MUST 尝试通过浏览器 side panel API 打开 TabTrail side panel

### Requirement: 入口能力不可用时提供降级说明
TabTrail SHALL 在 side panel 打开能力不可用时提供可理解的降级说明。

#### Scenario: 浏览器不支持打开侧边栏 API
- **WHEN** 用户点击打开 side panel 入口且浏览器 API 不可用
- **THEN** 系统 MUST 展示无法自动打开的说明，并提示用户从浏览器扩展入口手动打开

### Requirement: Popup 展示当前状态摘要
TabTrail popup SHALL 展示最近活跃、最近关闭和当前打开标签的摘要信息。

#### Scenario: 用户打开 popup
- **WHEN** popup 初始化完成
- **THEN** 系统 MUST 展示最近活跃数量、最近关闭数量和当前可整理标签数量

### Requirement: 支持扩展图标打开侧边栏偏好
TabTrail SHALL 支持用户选择扩展图标点击行为。

#### Scenario: 用户启用点击图标打开侧边栏
- **WHEN** 用户启用该偏好
- **THEN** 系统 MUST 在浏览器支持时配置点击扩展图标打开 side panel

#### Scenario: 用户禁用点击图标打开侧边栏
- **WHEN** 用户禁用该偏好
- **THEN** 系统 MUST 保持点击扩展图标打开 popup 的行为
