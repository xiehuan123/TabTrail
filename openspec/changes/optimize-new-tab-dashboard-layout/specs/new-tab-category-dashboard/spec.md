## ADDED Requirements

### Requirement: 分类优先的新标签页仪表盘
TabTrail 新标签页仪表盘 SHALL 使用分类优先布局展示标签整理入口。

#### Scenario: 桌面宽度展示分类标题网格
- **WHEN** 用户在桌面宽度打开新标签页仪表盘
- **THEN** 系统 MUST 在主要内容区展示一组可换行的分类标题按钮，并且一行 MUST 能展示多个分类标题

#### Scenario: 切换当前分类
- **WHEN** 用户点击某个分类标题
- **THEN** 系统 MUST 将该分类设为当前分类，并且内容区 MUST 只展示该分类中的标签

#### Scenario: 分类标题显示数量
- **WHEN** 系统展示分类标题
- **THEN** 每个分类标题 MUST 显示分类名称和该分类内的标签数量

### Requirement: 仪表盘支持新建手动分类
TabTrail 新标签页仪表盘 SHALL 支持用户通过分类输入区为当前打开标签建立手动分类。

#### Scenario: 归类已选标签到新分类
- **WHEN** 用户选择一个或多个当前打开标签，输入不存在的分类名，并触发归类动作
- **THEN** 系统 MUST 创建该手动分类并将选中标签加入该分类

#### Scenario: 归类已选标签到已有分类
- **WHEN** 用户选择一个或多个当前打开标签，输入已有分类名，并触发归类动作
- **THEN** 系统 MUST 将选中标签移动或加入该手动分类

#### Scenario: 阻止创建空分类
- **WHEN** 用户没有选择任何当前打开标签并触发归类动作
- **THEN** 系统 MUST NOT 创建空分类，并且 MUST 提示用户先选择标签

### Requirement: 仪表盘支持拖拽归类
TabTrail 新标签页仪表盘 SHALL 支持用户将当前打开标签拖拽到可写手动分类标题上完成归类。

#### Scenario: 拖拽打开标签到手动分类
- **WHEN** 用户将一个当前打开标签拖拽到手动分类标题并释放
- **THEN** 系统 MUST 将该标签加入目标手动分类

#### Scenario: 阻止拖拽到最近关闭
- **WHEN** 用户尝试将打开标签拖拽到最近关闭分类标题
- **THEN** 系统 MUST NOT 修改最近关闭分类内容

#### Scenario: 阻止拖拽最近关闭记录
- **WHEN** 用户查看最近关闭分类
- **THEN** 最近关闭记录 MUST NOT 可拖拽到任何分类

### Requirement: 仪表盘支持关闭分类
TabTrail 新标签页仪表盘 SHALL 支持关闭普通分类中的所有当前打开标签。

#### Scenario: 关闭手动分类
- **WHEN** 用户触发关闭手动分类动作并确认
- **THEN** 系统 MUST 关闭该手动分类中所有当前打开标签

#### Scenario: 关闭网站域名分类
- **WHEN** 用户触发关闭网站域名分类动作并确认
- **THEN** 系统 MUST 关闭该网站域名分类中所有当前打开标签

#### Scenario: 关闭分类前确认
- **WHEN** 用户触发关闭分类动作
- **THEN** 系统 MUST 在关闭前展示确认提示，提示中 MUST 包含分类名称和将关闭的标签数量

#### Scenario: 禁止关闭全部分类
- **WHEN** 当前分类为全部分类
- **THEN** 系统 MUST NOT 提供关闭分类动作

#### Scenario: 禁止关闭最近关闭分类
- **WHEN** 当前分类为最近关闭分类
- **THEN** 系统 MUST NOT 提供关闭分类动作

### Requirement: 最近关闭在仪表盘中保持只读
TabTrail 新标签页仪表盘 SHALL 将最近关闭作为只读系统分类处理。

#### Scenario: 查看最近关闭分类
- **WHEN** 用户切换到最近关闭分类
- **THEN** 系统 MUST 展示最近关闭记录和时间信息，并允许用户重新打开记录

#### Scenario: 阻止编辑最近关闭分类
- **WHEN** 用户查看最近关闭分类
- **THEN** 系统 MUST NOT 允许勾选、拖拽、归类、关闭分类或批量关闭其中的记录

### Requirement: 仪表盘移除侧边栏入口
TabTrail 新标签页仪表盘 SHALL NOT 将打开 side panel 作为页面主操作或顶部命令。

#### Scenario: 用户打开新标签页仪表盘
- **WHEN** 新标签页仪表盘渲染完成
- **THEN** 页面 MUST NOT 展示“打开侧边栏”按钮

#### Scenario: 用户需要侧边栏
- **WHEN** 用户希望使用 side panel
- **THEN** 系统 MUST 通过 popup 或浏览器扩展入口提供 side panel 能力，而不是依赖新标签页按钮
