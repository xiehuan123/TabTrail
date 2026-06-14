## MODIFIED Requirements

### Requirement: 新标签页仪表盘必须作为默认整理工作台
TabTrail SHALL 使用 `chrome_url_overrides.newtab` 将浏览器普通新标签页替换为 TabTrail 仪表盘，用于展示当前打开标签、最近活跃、最近关闭和整理操作。

#### Scenario: 用户打开普通新标签页
- **WHEN** 用户打开浏览器普通新标签页
- **THEN** 系统 MUST 展示 TabTrail 新标签页仪表盘，而不是空白页面

#### Scenario: 用户首次安装后进入新标签页工作台
- **WHEN** 用户首次安装后打开 TabTrail 新标签页工作台，且首次引导状态为待展示
- **THEN** 系统 MUST 在工作台中展示首次安装引导，并保持搜索、范围切换、分类和最近记录区域可进入

#### Scenario: 新标签页不修改默认搜索引擎
- **WHEN** 用户在 TabTrail 新标签页仪表盘中使用搜索或整理入口
- **THEN** 系统 MUST NOT 修改浏览器默认搜索引擎、主页或地址栏搜索行为

### Requirement: 新标签页仪表盘必须展示分类优先视图
TabTrail 新标签页仪表盘 SHALL 以分类为主要导航单位，展示全部标签、手动分类、网站域名分类和最近关闭分类。

#### Scenario: 用户查看分类列表
- **WHEN** 新标签页仪表盘加载完成
- **THEN** 系统 MUST 展示可切换的分类列表，并默认选中全部标签分类

#### Scenario: 用户选择分类
- **WHEN** 用户点击某个分类
- **THEN** 系统 MUST 展示该分类下的标签列表和可用操作
