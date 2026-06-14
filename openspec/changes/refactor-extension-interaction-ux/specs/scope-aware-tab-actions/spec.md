## ADDED Requirements

### Requirement: 范围切换必须明确当前状态
TabTrail SHALL 在 side panel 和 newtab 中明确展示当前操作范围。

#### Scenario: 用户选择当前窗口范围
- **WHEN** 用户选择当前窗口
- **THEN** 系统 MUST 将当前窗口标记为已选范围，并在摘要中展示当前窗口范围内的标签数量

#### Scenario: 用户选择全部窗口范围
- **WHEN** 用户选择全部窗口
- **THEN** 系统 MUST 将全部窗口标记为已选范围，并在摘要中展示全部窗口范围内的标签数量

### Requirement: 范围控件必须使用匹配语义
TabTrail SHALL 使用与范围切换行为匹配的控件语义。

#### Scenario: 渲染范围切换控件
- **WHEN** 系统渲染当前窗口和全部窗口切换入口
- **THEN** 控件 MUST 使用分段按钮或等价语义表达当前选择，而不得使用不完整的 tablist 语义

#### Scenario: 用户使用辅助技术浏览范围控件
- **WHEN** 用户通过屏幕阅读器聚焦范围切换控件
- **THEN** 系统 MUST 读出控件名称、选项名称和当前选中状态

### Requirement: 高风险操作必须包含范围信息
TabTrail 在关闭标签、关闭分类或应用影响多标签的操作时 SHALL 明确展示当前范围。

#### Scenario: 用户在全部窗口范围关闭已选标签
- **WHEN** 用户在全部窗口范围触发关闭已选标签
- **THEN** 确认或结果文案 MUST 包含全部窗口范围和关闭数量

#### Scenario: 用户在当前窗口范围应用排序
- **WHEN** 用户在当前窗口范围应用排序
- **THEN** 系统 MUST 告知排序将应用到当前窗口范围内的标签

### Requirement: 切换范围后选择状态必须安全处理
TabTrail SHALL 在当前窗口和全部窗口之间切换时安全处理已选标签。

#### Scenario: 用户切换到不包含部分已选标签的范围
- **WHEN** 用户从全部窗口切换到当前窗口，且部分已选标签不属于当前窗口
- **THEN** 系统 MUST 清除不可见标签的选择状态或提示用户选择已按范围更新

#### Scenario: 用户切换范围后执行批量关闭
- **WHEN** 用户切换范围后立即触发批量关闭
- **THEN** 系统 MUST 只关闭当前可见且仍被选中的标签

### Requirement: 范围状态必须在 popup 入口中保持可理解
TabTrail popup SHALL 在打开 side panel 或展示摘要时避免让用户误以为操作会跨全部窗口执行。

#### Scenario: 用户从 popup 打开 side panel
- **WHEN** 用户点击打开侧边栏入口
- **THEN** 系统 MUST 在 side panel 中默认展示清晰的当前范围状态
