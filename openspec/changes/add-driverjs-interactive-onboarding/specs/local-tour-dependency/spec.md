## ADDED Requirements

### Requirement: 引导库必须本地打包
TabTrail SHALL 将 Driver.js 资源随扩展一起打包，并且 MUST NOT 从远程来源加载引导 JavaScript 或 CSS。

#### Scenario: 扩展页面加载引导资源
- **WHEN** TabTrail 新标签页引导加载 Driver.js
- **THEN** 页面 MUST 只引用扩展包内的 Driver.js JavaScript 和 CSS 文件

#### Scenario: 构建产物包含引导资源
- **WHEN** 扩展构建完成
- **THEN** `dist/` MUST 包含新标签页引导所需的 Driver.js JavaScript、CSS 和 license 文件

#### Scenario: 远程引导资源必须被拒绝
- **WHEN** 项目检查扫描 onboarding 相关 HTML、JavaScript、CSS、包元数据和构建产物
- **THEN** 如果引导资源引用 CDN 或 `http://`、`https://`、`unpkg`、`jsdelivr`、`cdnjs` 等远程来源，检查 MUST 失败

### Requirement: 引导依赖必须具备兼容许可
TabTrail SHALL 使用与 Chrome Web Store 打包分发兼容的引导依赖，并且不能引入 AGPL 源码披露义务。

#### Scenario: 选择 Driver.js
- **WHEN** 添加交互式引导依赖
- **THEN** 依赖 MUST 是 MIT 许可的 Driver.js，或是在后续 OpenSpec 变更中批准的同等或更宽松许可依赖

#### Scenario: AGPL 引导库必须被拒绝
- **WHEN** 项目检查扫描依赖和 vendor 化的引导资源
- **THEN** 如果加入 Intro.js 或其他 AGPL 引导库且仓库中没有明确商业授权记录，检查 MUST 失败

#### Scenario: 保留许可文本
- **WHEN** Driver.js 资源被复制或 vendor 到扩展包内
- **THEN** 仓库或构建产物中 MUST 保留 Driver.js 的 license 文本

### Requirement: 引导依赖不得改变扩展权限
TabTrail SHALL 在不新增与标签整理和引导展示无关的浏览器权限前提下集成引导库。

#### Scenario: Manifest 权限保持收敛
- **WHEN** Driver.js 交互式引导实现完成
- **THEN** `manifest.json` MUST NOT 仅为了加载、追踪、配置或更新引导内容而新增权限

#### Scenario: 引导不收集遥测
- **WHEN** 用户前进、完成、跳过或重新打开交互式引导
- **THEN** 系统 MUST NOT 将引导交互数据发送到远程服务
