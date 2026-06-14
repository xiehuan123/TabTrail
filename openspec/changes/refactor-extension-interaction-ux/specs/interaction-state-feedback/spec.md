## ADDED Requirements

### Requirement: 每个界面入口必须提供专用状态公告区域
TabTrail 在 popup、side panel 和 newtab 中 SHALL 提供专用状态公告区域，用于展示操作结果、错误、空状态提示和恢复提示。

#### Scenario: 操作成功后公告结果
- **WHEN** 用户完成打开侧边栏、保存偏好、归类、排序、关闭或恢复操作
- **THEN** 系统 MUST 在专用状态区域展示简短结果文案，并通过辅助技术公告该结果

#### Scenario: 初始化失败后公告错误
- **WHEN** popup、side panel 或 newtab 无法读取必要标签数据
- **THEN** 系统 MUST 展示错误状态，并通过错误公告语义告知用户可以刷新或稍后重试

### Requirement: 列表区域不得作为大段动态公告源
TabTrail SHALL 避免把完整标签列表或分组列表作为整体 live region。

#### Scenario: 搜索导致列表重渲染
- **WHEN** 用户输入搜索词导致标签列表更新
- **THEN** 系统 MUST 只公告匹配数量或空结果摘要，而不是朗读完整标签列表

#### Scenario: 归类导致分组重渲染
- **WHEN** 用户将标签归入分类并触发分组列表更新
- **THEN** 系统 MUST 只公告归类结果和目标分类，而不是朗读所有分组内容

### Requirement: 关闭操作必须提供恢复反馈
TabTrail 在关闭标签或关闭分类后 SHALL 提供可见恢复反馈。

#### Scenario: 用户关闭已选标签
- **WHEN** 用户成功关闭一个或多个已选标签
- **THEN** 系统 MUST 展示关闭数量、操作范围和恢复方式

#### Scenario: 用户关闭分类
- **WHEN** 用户成功关闭一个普通分类中的标签
- **THEN** 系统 MUST 展示分类名称、关闭数量和恢复方式

### Requirement: 排序状态必须区分待应用和已应用
TabTrail SHALL 明确展示排序预览是否已经应用到浏览器标签栏。

#### Scenario: 用户调整预览排序
- **WHEN** 用户通过上移、下移或拖拽改变标签预览顺序
- **THEN** 系统 MUST 展示存在未应用排序，并启用应用排序入口

#### Scenario: 用户应用排序成功
- **WHEN** 用户点击应用排序且浏览器标签移动成功
- **THEN** 系统 MUST 公告排序已应用，并清除未应用状态

#### Scenario: 用户应用排序失败
- **WHEN** 用户点击应用排序但浏览器标签移动失败
- **THEN** 系统 MUST 公告失败状态，并保留用户当前预览顺序

### Requirement: 空状态必须给出下一步动作
TabTrail SHALL 在无标签、无搜索结果、无最近记录等空状态下给出用户下一步可执行动作。

#### Scenario: 搜索没有匹配标签
- **WHEN** 用户搜索后没有匹配标签
- **THEN** 系统 MUST 展示无结果说明，并提供清空搜索或修改关键词的入口

#### Scenario: 最近关闭为空
- **WHEN** 最近关闭没有记录
- **THEN** 系统 MUST 展示最近关闭为空的说明，而不是隐藏该状态或留下空列表
