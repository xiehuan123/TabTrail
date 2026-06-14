## MODIFIED Requirements

### Requirement: 新标签页提供完整整理工作台
TabTrail 新标签页仪表盘 SHALL 提供分类优先的完整标签整理视图。

#### Scenario: 仪表盘初始化完成
- **WHEN** 新标签页加载完成
- **THEN** 系统 MUST 展示当前打开标签摘要、分类标题网格、当前分类内容区、最近活跃、最近关闭和主要整理操作

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

#### Scenario: 用户在新标签页中完成分类
- **WHEN** 用户在新标签页中新建分类、拖拽归类或归类已选标签
- **THEN** 系统 MUST 写入与 side panel 相同的分类偏好存储

#### Scenario: 用户在新标签页中完成排序或关闭
- **WHEN** 用户在新标签页中应用排序、关闭已选标签或关闭分类
- **THEN** 系统 MUST 使用与 side panel 一致的标签整理模型和确认规则

### Requirement: 新标签页响应式可用
TabTrail 新标签页仪表盘 SHALL 在常见桌面宽度和窄窗口宽度下保持可读可操作。

#### Scenario: 桌面宽屏打开仪表盘
- **WHEN** 可用宽度大于等于 1024px
- **THEN** 系统 SHOULD 使用分类标题网格和当前分类内容区展示整理工作台

#### Scenario: 窄窗口打开仪表盘
- **WHEN** 可用宽度小于 768px
- **THEN** 系统 MUST 保持分类标题可换行或可滚动访问，并避免横向滚动、文本溢出和控件重叠

## REMOVED Requirements

### Requirement: 新标签页提供 side panel 入口
**Reason**: 新标签页仪表盘已经成为默认整理入口，继续提供“打开侧边栏”按钮会让主流程不清晰，并与用户要求移除该按钮冲突。

**Migration**: side panel 入口保留在 popup 和浏览器扩展入口中；新标签页专注于直接整理标签。
