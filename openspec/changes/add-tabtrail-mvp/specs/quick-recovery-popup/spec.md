## ADDED Requirements

### Requirement: 展示最近活跃标签
TabTrail popup SHALL 展示最近活跃的打开标签，数量上限为 8 个。

#### Scenario: 打开 popup
- **WHEN** 用户点击插件图标打开 popup
- **THEN** 系统 MUST 展示最多 8 个仍然打开的最近活跃标签

#### Scenario: 点击最近活跃标签
- **WHEN** 用户点击 popup 中的最近活跃标签
- **THEN** 系统 MUST 激活该标签所在窗口并切换到该标签

### Requirement: 展示最近关闭标签
TabTrail popup SHALL 展示最近关闭的标签，数量上限为 8 个。

#### Scenario: 打开 popup 查看最近关闭
- **WHEN** 用户点击插件图标打开 popup
- **THEN** 系统 MUST 展示最多 8 个最近关闭标签

#### Scenario: 重新打开最近关闭标签
- **WHEN** 用户点击 popup 中的最近关闭标签
- **THEN** 系统 MUST 使用该记录的 URL 重新打开标签

### Requirement: 固定标签优先展示
TabTrail popup SHALL 在最近活跃区域优先展示插件内固定的打开标签。

#### Scenario: 存在固定的打开标签
- **WHEN** popup 渲染最近活跃标签列表
- **THEN** 系统 MUST 将插件内固定且仍然打开的标签排在非固定标签之前

### Requirement: popup 不提供完整整理能力
TabTrail popup SHALL 只提供快速切换和恢复入口，不提供侧边栏级别的完整整理能力。

#### Scenario: 用户打开 popup
- **WHEN** popup 渲染
- **THEN** 系统 MUST NOT 提供拖拽排序、批量关闭或手动分类编辑入口
