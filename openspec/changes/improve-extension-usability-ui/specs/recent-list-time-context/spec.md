## ADDED Requirements

### Requirement: 最近活跃显示时间
TabTrail SHALL 在最近活跃列表中显示每条记录的时间信息。

#### Scenario: 渲染最近活跃记录
- **WHEN** popup 或 side panel 展示最近活跃记录
- **THEN** 系统 MUST 为每条记录显示人类可读的时间文本

### Requirement: 最近关闭显示时间
TabTrail SHALL 在最近关闭列表中显示每条记录的时间信息。

#### Scenario: 渲染最近关闭记录
- **WHEN** popup 或 side panel 展示最近关闭记录
- **THEN** 系统 MUST 为每条记录显示人类可读的时间文本

### Requirement: 时间文本可区分新旧
TabTrail SHALL 使用能快速区分新旧程度的时间格式。

#### Scenario: 记录发生在一分钟内
- **WHEN** 记录时间距离当前时间小于 1 分钟
- **THEN** 系统 MUST 显示“刚刚”

#### Scenario: 记录发生在今天
- **WHEN** 记录时间发生在当前自然日
- **THEN** 系统 MUST 显示相对分钟或当天具体时间

#### Scenario: 记录发生在更早日期
- **WHEN** 记录时间早于当前自然日
- **THEN** 系统 MUST 显示日期或“昨天”加时间

### Requirement: 长时间打开时刷新相对时间
TabTrail SHALL 在 popup 或 side panel 长时间停留时刷新相对时间。

#### Scenario: side panel 保持打开超过一分钟
- **WHEN** side panel 已打开且最近列表仍可见
- **THEN** 系统 MUST 至少每分钟刷新一次相对时间文本
