## ADDED Requirements

### Requirement: 记录最近标签活动
TabTrail SHALL 在本机记录最近的标签打开、激活和关闭活动。

#### Scenario: 记录标签打开
- **WHEN** 用户打开一个新标签或新页面
- **THEN** 系统 MUST 保存一条打开活动记录，包含标签标题、URL、域名、窗口标识、标签标识、时间戳和活动类型

#### Scenario: 记录标签激活
- **WHEN** 用户切换到另一个打开标签
- **THEN** 系统 MUST 保存一条激活活动记录，并将该标签纳入最近活跃列表

#### Scenario: 记录标签关闭
- **WHEN** 用户关闭一个标签
- **THEN** 系统 MUST 保存一条关闭活动记录，并将该标签纳入最近关闭列表

### Requirement: 限制最近记录数量
TabTrail SHALL 只在本机保留最近 100 条标签活动记录。

#### Scenario: 超过保留数量
- **WHEN** 新活动记录写入后总记录数量超过 100 条
- **THEN** 系统 MUST 删除最旧的活动记录，直到记录数量不超过 100 条

### Requirement: 最近记录仅本机保存
TabTrail SHALL 将最近标签活动记录保存在本机存储，不得同步到浏览器账号。

#### Scenario: 保存最近活动
- **WHEN** 系统写入打开、激活或关闭活动记录
- **THEN** 系统 MUST 使用本机存储保存该记录，并且 MUST NOT 将该记录写入同步存储

### Requirement: 清空最近关闭记录
TabTrail SHALL 允许用户一键清空最近关闭记录。

#### Scenario: 用户清空最近关闭
- **WHEN** 用户触发清空最近关闭动作
- **THEN** 系统 MUST 删除所有关闭类型的最近活动记录，并保留其他类型的最近活动记录
