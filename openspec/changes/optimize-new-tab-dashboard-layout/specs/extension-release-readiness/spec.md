## ADDED Requirements

### Requirement: 插件版本升级
TabTrail SHALL 在本次仪表盘优化完成后升级插件版本号。

#### Scenario: 发布元数据一致
- **WHEN** 本次变更实现完成
- **THEN** `manifest.json` 和 `package.json` 中的版本号 MUST 从 `0.1.0` 升级到 `0.2.0`

#### Scenario: 版本升级在功能完成后执行
- **WHEN** 仪表盘布局、分类归类和关闭分类能力尚未完成
- **THEN** 系统 MUST NOT 提前升级插件版本号

### Requirement: 提供中文 README
TabTrail SHALL 提供中文 `README.md`，说明插件能力和使用边界。

#### Scenario: 用户阅读 README
- **WHEN** 用户打开项目 README
- **THEN** README MUST 说明 TabTrail 的核心功能、安装方式、新标签页仪表盘、侧边栏入口、分类整理、最近活跃、最近关闭和批量关闭

#### Scenario: 用户关注权限和隐私
- **WHEN** 用户阅读 README 的权限或隐私说明
- **THEN** README MUST 说明 `tabs`、`storage`、`sidePanel`、`sessions` 权限用途，并说明最近活动记录不上传、不读取网页正文

#### Scenario: 用户关注浏览器限制
- **WHEN** 用户阅读 README 的限制说明
- **THEN** README MUST 说明普通扩展不能直接隐藏浏览器原生顶部标签栏，并说明禁用扩展可恢复浏览器默认新标签页
