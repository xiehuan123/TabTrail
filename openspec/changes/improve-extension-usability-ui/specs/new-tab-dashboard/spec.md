## ADDED Requirements

### Requirement: 新标签页展示 TabTrail 仪表盘
TabTrail SHALL 使用浏览器扩展的新标签页覆盖能力展示 TabTrail 仪表盘。

#### Scenario: 用户打开新标签页
- **WHEN** 用户在浏览器中新建普通标签页
- **THEN** 系统 MUST 展示 TabTrail 仪表盘页面，而不是浏览器默认新标签页

#### Scenario: 扩展被禁用
- **WHEN** 用户禁用 TabTrail 扩展
- **THEN** 浏览器 MUST 恢复自身默认新标签页行为

### Requirement: 新标签页不修改默认搜索引擎
TabTrail SHALL NOT 修改用户默认搜索引擎、主页或地址栏搜索行为。

#### Scenario: 用户在地址栏搜索
- **WHEN** 用户通过浏览器地址栏输入搜索词
- **THEN** 搜索 MUST 继续使用浏览器当前默认搜索引擎

#### Scenario: 用户在 TabTrail 仪表盘中搜索
- **WHEN** 用户在 TabTrail 仪表盘搜索框输入内容
- **THEN** 系统 MUST 优先搜索和过滤当前打开标签

### Requirement: 新标签页提供完整整理工作台
TabTrail 新标签页仪表盘 SHALL 提供比 popup 和 side panel 更完整的标签整理视图。

#### Scenario: 仪表盘初始化完成
- **WHEN** 新标签页加载完成
- **THEN** 系统 MUST 展示当前打开标签摘要、最近活跃、最近关闭、分组列表和主要整理操作

#### Scenario: 用户点击打开标签
- **WHEN** 用户点击仪表盘中的打开标签记录
- **THEN** 系统 MUST 激活对应浏览器标签

#### Scenario: 用户点击最近关闭记录
- **WHEN** 用户点击仪表盘中的最近关闭记录
- **THEN** 系统 MUST 尝试重新打开对应 URL

### Requirement: 新标签页与 side panel 数据一致
TabTrail 新标签页仪表盘 SHALL 复用现有最近记录、分类偏好、置顶偏好和排序预览数据。

#### Scenario: 用户在 side panel 中完成分类
- **WHEN** 用户打开新标签页仪表盘
- **THEN** 系统 MUST 展示与 side panel 一致的分类结果

#### Scenario: 用户在新标签页中完成整理操作
- **WHEN** 操作会改变分类、置顶或排序预览
- **THEN** 系统 MUST 写入与 side panel 相同的偏好存储

### Requirement: 新标签页提供 side panel 入口
TabTrail 新标签页仪表盘 SHALL 提供打开 side panel 的入口。

#### Scenario: 用户需要边浏览边整理
- **WHEN** 用户点击打开 side panel 入口
- **THEN** 系统 MUST 在浏览器支持时尝试打开 TabTrail side panel

#### Scenario: 浏览器不支持自动打开 side panel
- **WHEN** 自动打开 side panel 能力不可用
- **THEN** 系统 MUST 展示清晰降级说明和手动打开方式

### Requirement: 新标签页响应式可用
TabTrail 新标签页仪表盘 SHALL 在常见桌面宽度和窄窗口宽度下保持可读可操作。

#### Scenario: 桌面宽屏打开仪表盘
- **WHEN** 可用宽度大于等于 1024px
- **THEN** 系统 SHOULD 使用多栏工作台布局展示最近区、标签区和操作区

#### Scenario: 窄窗口打开仪表盘
- **WHEN** 可用宽度小于 768px
- **THEN** 系统 MUST 切换为单列或可折叠布局，并避免横向滚动、文本溢出和控件重叠
