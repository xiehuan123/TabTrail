## ADDED Requirements

### Requirement: 同步轻量偏好和元数据
TabTrail SHALL 通过浏览器同步存储保存轻量偏好和元数据。

#### Scenario: 保存用户偏好
- **WHEN** 用户修改分类、固定状态、排序偏好或视图偏好
- **THEN** 系统 MUST 将这些轻量数据保存到同步存储

### Requirement: 不同步最近活动记录
TabTrail SHALL NOT 将最近打开、激活或关闭活动记录写入同步存储。

#### Scenario: 产生最近活动
- **WHEN** 系统记录打开、激活或关闭活动
- **THEN** 系统 MUST NOT 将该活动记录写入同步存储

### Requirement: 本机状态和同步状态分离
TabTrail SHALL 清晰区分本机高频状态和跨设备同步状态。

#### Scenario: 读取 TabTrail 状态
- **WHEN** popup 或 side panel 初始化
- **THEN** 系统 MUST 从本机存储读取最近活动记录，并从同步存储读取分类、固定状态和偏好设置

### Requirement: 同步数据失败时保持本机可用
TabTrail SHALL 在同步存储不可用或失败时保持核心本机功能可用。

#### Scenario: 同步存储写入失败
- **WHEN** 系统保存同步偏好失败
- **THEN** 系统 MUST 保持最近活动记录、popup 和 side panel 的本机功能可用
