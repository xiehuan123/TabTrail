## ADDED Requirements

### Requirement: 支持窗口范围切换
TabTrail side panel SHALL 支持在当前窗口和全部窗口两个范围之间切换。

#### Scenario: 默认打开侧边栏
- **WHEN** 用户打开 side panel
- **THEN** 系统 MUST 默认展示当前窗口的打开标签

#### Scenario: 切换到全部窗口
- **WHEN** 用户选择全部窗口范围
- **THEN** 系统 MUST 展示所有浏览器窗口中的打开标签

### Requirement: 自动按网站分组
TabTrail side panel SHALL 默认按网站域名对打开标签进行自动分组。

#### Scenario: 展示打开标签
- **WHEN** side panel 渲染标签列表
- **THEN** 系统 MUST 根据每个标签的域名生成网站分组

### Requirement: 支持手动分类当前打开标签
TabTrail side panel SHALL 支持用户为当前打开标签建立和调整手动分类。

#### Scenario: 将打开标签加入手动分类
- **WHEN** 用户把一个打开标签加入手动分类
- **THEN** 系统 MUST 在 side panel 中按该分类展示该打开标签

#### Scenario: 标签关闭后不保留在手动分类
- **WHEN** 一个已加入手动分类的标签被关闭
- **THEN** 系统 MUST 从该手动分类的当前打开标签列表中移除它

### Requirement: 提供只读最近关闭系统分类
TabTrail side panel SHALL 提供“最近关闭”系统分类，并限制用户编辑该分类内容。

#### Scenario: 展示最近关闭分类
- **WHEN** side panel 渲染分类列表
- **THEN** 系统 MUST 展示由关闭活动记录生成的最近关闭系统分类

#### Scenario: 阻止编辑最近关闭内容
- **WHEN** 用户查看最近关闭系统分类
- **THEN** 系统 MUST NOT 允许用户拖拽排序、移动、手动添加、单条删除或改分类其中的记录

#### Scenario: 清空最近关闭分类
- **WHEN** 用户触发清空最近关闭动作
- **THEN** 系统 MUST 清空最近关闭系统分类中的所有记录

### Requirement: 支持本地搜索
TabTrail side panel SHALL 支持按标题、URL 和域名搜索当前视图中的标签。

#### Scenario: 搜索当前窗口
- **WHEN** 当前范围为当前窗口且用户输入搜索词
- **THEN** 系统 MUST 只在当前窗口的打开标签中按标题、URL 和域名匹配

#### Scenario: 搜索全部窗口
- **WHEN** 当前范围为全部窗口且用户输入搜索词
- **THEN** 系统 MUST 在全部窗口的打开标签中按标题、URL 和域名匹配

### Requirement: 支持预览排序并应用到标签栏
TabTrail side panel SHALL 支持拖拽预览排序，并在用户确认后应用到浏览器真实标签栏。

#### Scenario: 拖拽排序
- **WHEN** 用户在 side panel 中拖拽改变标签顺序
- **THEN** 系统 MUST 只更新 side panel 中的预览顺序，不得立即改变浏览器真实标签栏顺序

#### Scenario: 应用排序
- **WHEN** 用户点击应用到标签栏
- **THEN** 系统 MUST 将当前预览顺序同步到对应浏览器窗口的真实标签栏

### Requirement: 支持批量关闭
TabTrail side panel SHALL 支持用户多选打开标签并批量关闭。

#### Scenario: 关闭一到两个标签
- **WHEN** 用户选择 1 个或 2 个标签并触发关闭
- **THEN** 系统 MUST 直接关闭这些标签

#### Scenario: 关闭三个及以上标签
- **WHEN** 用户选择 3 个或更多标签并触发关闭
- **THEN** 系统 MUST 在关闭前要求用户确认

### Requirement: 插件内固定标签
TabTrail side panel SHALL 支持插件内固定标签，并且不得改变浏览器原生固定标签状态。

#### Scenario: 固定打开标签
- **WHEN** 用户在 TabTrail 中固定一个打开标签
- **THEN** 系统 MUST 在 TabTrail 展示中提升该标签优先级，并且 MUST NOT 改变浏览器原生 pinned 状态
