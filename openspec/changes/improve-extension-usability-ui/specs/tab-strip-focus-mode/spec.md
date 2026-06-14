## ADDED Requirements

### Requirement: 明确不能直接隐藏原生标签栏
TabTrail SHALL 明确说明普通扩展不能直接隐藏浏览器原生顶部标签栏。

#### Scenario: 用户查看专注整理说明
- **WHEN** 用户打开与隐藏顶部标签栏相关的说明或入口
- **THEN** 系统 MUST 明确说明 TabTrail 不能直接隐藏浏览器原生标签栏

### Requirement: 提供专注整理模式入口
TabTrail SHALL 提供专注整理模式入口，用于减少顶部标签栏拥挤。

#### Scenario: 用户打开 side panel
- **WHEN** side panel 渲染
- **THEN** 系统 MUST 展示专注整理模式入口或说明

### Requirement: 专注整理模式不丢失可恢复性
TabTrail SHALL 在专注整理模式中避免不可恢复地丢失标签。

#### Scenario: 用户使用专注整理相关批量关闭能力
- **WHEN** 用户关闭多个标签以减少顶部标签栏拥挤
- **THEN** 系统 MUST 保持这些标签进入最近关闭记录，用户可以重新打开

### Requirement: 专注整理模式使用确认
TabTrail SHALL 对会影响真实浏览器标签栏的专注整理动作要求确认。

#### Scenario: 用户触发会关闭或移动多个真实标签的动作
- **WHEN** 动作会影响 3 个或更多真实标签
- **THEN** 系统 MUST 在执行前要求用户确认

### Requirement: 提供替代建议
TabTrail SHALL 在无法隐藏原生标签栏时提供替代建议。

#### Scenario: 用户想隐藏顶部标签栏
- **WHEN** 用户查看顶部标签栏相关说明
- **THEN** 系统 MUST 提供使用 side panel、批量整理、窗口分组或浏览器自身设置的替代建议
