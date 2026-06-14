## ADDED Requirements

### Requirement: Side panel 顶部展示整理状态
TabTrail side panel SHALL 在顶部展示当前整理状态摘要。

#### Scenario: 用户打开 side panel
- **WHEN** side panel 初始化完成
- **THEN** 系统 MUST 展示当前范围、打开标签数量、最近活跃数量和最近关闭数量

### Requirement: Side panel 工具区集中常用操作
TabTrail side panel SHALL 将搜索、范围切换、分类、批量关闭和应用排序集中在清晰的工具区。

#### Scenario: 用户进入 side panel
- **WHEN** side panel 渲染
- **THEN** 系统 MUST 在标签列表之前展示常用整理工具

### Requirement: 最近活跃和最近关闭作为高优先级分区
TabTrail side panel SHALL 将最近活跃和最近关闭作为明显分区展示。

#### Scenario: 用户打开 side panel
- **WHEN** 最近活跃或最近关闭存在记录
- **THEN** 系统 MUST 在主要分组列表附近展示对应分区，并显示时间信息

### Requirement: 分组列表更易扫读
TabTrail side panel SHALL 使用更易扫读的分组布局展示网站分组和手动分类。

#### Scenario: 渲染多个网站分组
- **WHEN** 当前视图包含多个域名
- **THEN** 系统 MUST 显示每个分组的名称、数量和可折叠或视觉分隔的标签列表

### Requirement: 空状态提供下一步动作
TabTrail side panel SHALL 在无标签、无搜索结果或无最近记录时给出下一步动作。

#### Scenario: 搜索无结果
- **WHEN** 用户搜索后没有匹配标签
- **THEN** 系统 MUST 展示无结果状态，并提供清空搜索的入口

#### Scenario: 最近关闭为空
- **WHEN** 最近关闭没有记录
- **THEN** 系统 MUST 展示空状态，而不是隐藏整个概念
