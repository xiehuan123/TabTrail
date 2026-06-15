## MODIFIED Requirements

### Requirement: 首次安装必须打开一次性交互式引导
TabTrail 在首次安装后 SHALL 打开扩展内的新标签页工作台，并在工作台内展示一次性 Driver.js 交互式新手引导。

#### Scenario: 首次安装触发交互式引导
- **WHEN** 扩展收到 `runtime.onInstalled` 事件且原因是首次安装
- **THEN** 系统 MUST 记录引导待展示状态，并尝试打开 TabTrail 新标签页工作台

#### Scenario: 待展示状态自动启动交互式引导
- **WHEN** TabTrail 新标签页工作台加载完成且首次引导状态为 `pending`
- **THEN** 系统 MUST 自动启动 Driver.js 交互式引导

#### Scenario: 扩展更新不触发首次引导
- **WHEN** 扩展收到 `runtime.onInstalled` 事件且原因是更新
- **THEN** 系统 MUST NOT 自动打开首次安装引导页

#### Scenario: 打开新标签页失败后保留待展示状态
- **WHEN** 首次安装时打开新标签页失败
- **THEN** 系统 MUST 保留引导待展示状态，以便用户下次进入新标签页工作台时看到引导

### Requirement: 引导必须逐步指向核心工作流控件
TabTrail 首次安装引导 SHALL 通过交互式步骤高亮真实工作台控件，并说明用户完成标签整理的核心路径。

#### Scenario: 引导高亮核心控件
- **WHEN** 用户看到首次安装交互式引导
- **THEN** 系统 MUST 依次高亮欢迎说明、搜索框、范围切换、分类区域、当前分类列表、最近关闭区域和重新查看入口

#### Scenario: 引导解释核心动作
- **WHEN** 用户浏览首次安装交互式引导步骤
- **THEN** 系统 MUST 说明搜索标签、选择当前窗口或全部窗口、按分类整理、查看当前分类和从最近关闭恢复的用途

#### Scenario: 引导不阻塞工作台使用
- **WHEN** 首次安装引导正在展示
- **THEN** 用户 MUST 能跳过或关闭引导，并继续使用新标签页工作台

#### Scenario: 引导目标缺失时降级
- **WHEN** 某个引导目标元素因为空状态或渲染失败不可用
- **THEN** 系统 MUST 跳过该步骤或回退到可见兜底引导面板，且 MUST NOT 阻塞工作台初始化

### Requirement: 引导状态必须可完成和跳过
TabTrail SHALL 持久记录用户完成或跳过首次安装交互式引导的状态。

#### Scenario: 用户完成交互式引导
- **WHEN** 用户完成 Driver.js 交互式引导
- **THEN** 系统 MUST 将引导状态记录为已完成，并结束当前交互式引导

#### Scenario: 用户跳过交互式引导
- **WHEN** 用户在 Driver.js 交互式引导中点击跳过或关闭
- **THEN** 系统 MUST 将引导状态记录为已跳过，并结束当前交互式引导

#### Scenario: 已完成或已跳过后不重复展示
- **WHEN** 用户再次打开 TabTrail 新标签页工作台
- **THEN** 系统 MUST NOT 自动展示首次安装交互式引导

#### Scenario: 状态保存失败时不阻塞
- **WHEN** 用户完成或跳过交互式引导但偏好状态保存失败
- **THEN** 系统 MUST 结束当前交互式引导，并通过状态公告说明引导已关闭但状态无法同步保存

### Requirement: 用户必须能重新查看交互式引导
TabTrail SHALL 提供低打扰入口，让用户在完成或跳过后重新查看首次安装交互式引导。

#### Scenario: 用户重新查看交互式引导
- **WHEN** 用户点击“重新查看新手引导”入口
- **THEN** 系统 MUST 再次启动 Driver.js 交互式引导

#### Scenario: 重新查看不自动改变状态
- **WHEN** 用户手动重新查看首次安装交互式引导
- **THEN** 系统 MUST NOT 将已完成或已跳过状态改回待展示状态

### Requirement: 引导必须符合 Chrome Web Store 发布约束
TabTrail 首次安装引导 SHALL 遵守 Chrome Web Store 对安装体验、权限、隐私和新标签页覆盖的审核约束。

#### Scenario: 引导不新增权限
- **WHEN** 首次安装交互式引导实现完成
- **THEN** manifest MUST NOT 为引导新增与标签整理无关的权限

#### Scenario: 引导说明隐私边界
- **WHEN** 用户看到首次安装交互式引导
- **THEN** 系统 MUST 明确说明 TabTrail 不上传标签数据

#### Scenario: 引导说明搜索边界
- **WHEN** 用户看到首次安装交互式引导
- **THEN** 系统 MUST 明确说明 TabTrail 新标签页是整理工作台，且不会修改默认搜索引擎

#### Scenario: 引导不加载远程代码
- **WHEN** 首次安装交互式引导页面加载
- **THEN** 系统 MUST 只使用扩展包内的 HTML、CSS 和 JavaScript，不得加载远程脚本执行代码
