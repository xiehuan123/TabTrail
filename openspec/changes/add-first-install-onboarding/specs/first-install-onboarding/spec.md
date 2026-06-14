## ADDED Requirements

### Requirement: 首次安装必须打开一次性引导
TabTrail 在首次安装后 SHALL 打开扩展内的新标签页工作台，并展示一次性新手引导。

#### Scenario: 首次安装触发引导
- **WHEN** 扩展收到 `runtime.onInstalled` 事件且原因是首次安装
- **THEN** 系统 MUST 记录引导待展示状态，并尝试打开 TabTrail 新标签页工作台

#### Scenario: 扩展更新不触发首次引导
- **WHEN** 扩展收到 `runtime.onInstalled` 事件且原因是更新
- **THEN** 系统 MUST NOT 自动打开首次安装引导页

#### Scenario: 打开新标签页失败后保留待展示状态
- **WHEN** 首次安装时打开新标签页失败
- **THEN** 系统 MUST 保留引导待展示状态，以便用户下次进入新标签页工作台时看到引导

### Requirement: 引导必须说明核心工作流
TabTrail 首次安装引导 SHALL 用简短步骤说明用户完成标签整理的核心路径。

#### Scenario: 引导展示三个核心步骤
- **WHEN** 用户看到首次安装引导
- **THEN** 系统 MUST 展示选择整理范围、打开侧边栏、从最近关闭恢复这三个核心步骤

#### Scenario: 引导不阻塞工作台使用
- **WHEN** 首次安装引导正在展示
- **THEN** 用户 MUST 仍然可以跳过引导或直接开始使用新标签页工作台

### Requirement: 引导状态必须可完成和跳过
TabTrail SHALL 持久记录用户完成或跳过首次安装引导的状态。

#### Scenario: 用户开始使用后关闭引导
- **WHEN** 用户点击“开始使用 TabTrail”
- **THEN** 系统 MUST 将引导状态记录为已完成，并从当前页面隐藏引导

#### Scenario: 用户跳过引导
- **WHEN** 用户点击“跳过”
- **THEN** 系统 MUST 将引导状态记录为已跳过，并从当前页面隐藏引导

#### Scenario: 已完成或已跳过后不重复展示
- **WHEN** 用户再次打开 TabTrail 新标签页工作台
- **THEN** 系统 MUST NOT 自动展示首次安装引导

### Requirement: 用户必须能重新查看引导
TabTrail SHALL 提供低打扰入口，让用户在完成或跳过后重新查看首次安装引导。

#### Scenario: 用户重新查看引导
- **WHEN** 用户点击“重新查看新手引导”入口
- **THEN** 系统 MUST 再次展示首次安装引导，但 MUST NOT 改变已完成或已跳过状态，除非用户再次明确操作

### Requirement: 引导必须符合 Chrome Web Store 发布约束
TabTrail 首次安装引导 SHALL 遵守 Chrome Web Store 对安装体验、权限、隐私和新标签页覆盖的审核约束。

#### Scenario: 引导不新增权限
- **WHEN** 首次安装引导实现完成
- **THEN** manifest MUST NOT 为引导新增与标签整理无关的权限

#### Scenario: 引导说明隐私边界
- **WHEN** 用户看到首次安装引导
- **THEN** 系统 MUST 明确说明 TabTrail 不上传标签数据

#### Scenario: 引导说明搜索边界
- **WHEN** 用户看到首次安装引导
- **THEN** 系统 MUST 明确说明 TabTrail 新标签页是整理工作台，且不会修改默认搜索引擎

#### Scenario: 引导不加载远程代码
- **WHEN** 首次安装引导页面加载
- **THEN** 系统 MUST 只使用扩展包内的 HTML、CSS 和 JavaScript，不得加载远程脚本执行代码
