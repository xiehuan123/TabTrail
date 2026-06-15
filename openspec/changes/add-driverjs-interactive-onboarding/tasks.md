## 1. Driver.js 依赖和构建

- [x] 1.1 添加 Driver.js 作为选定的交互式引导依赖，固定明确版本，并记录 MIT 许可。
- [x] 1.2 更新构建流程，确保 Driver.js JavaScript、CSS 和 license 文件随扩展本地打包。
- [x] 1.3 确保 newtab 只使用扩展包内的 Driver.js 资源，不引用 CDN 或远程引导资源。
- [x] 1.4 更新项目检查：除非仓库存在商业授权记录，否则拒绝 Intro.js 或 AGPL 引导依赖。
- [x] 1.5 更新项目检查：拒绝 `http://`、`https://`、`unpkg`、`jsdelivr`、`cdnjs` 等远程 onboarding 资源。

## 2. 新标签页引导目标

- [x] 2.1 为欢迎说明、搜索、范围切换、分类、当前列表、最近关闭和重新查看控件添加稳定的 `data-onboarding-target` 属性。
- [x] 2.2 保留可见的兜底 onboarding 面板或消息，用于 Driver.js 加载失败或引导目标缺失场景。
- [x] 2.3 调整 newtab 响应式 CSS，确保 Driver.js 弹出说明在桌面、窄宽度和 200% 缩放下适配，不遮挡关键控件。
- [x] 2.4 确认 onboarding 文案仍说明 TabTrail 不上传标签数据、不修改默认搜索引擎。

## 3. Driver.js 交互式引导集成

- [x] 3.1 新增一个轻量 newtab 引导模块或 helper，用 TabTrail 专属步骤和按钮文案初始化 Driver.js。
- [x] 3.2 仅在 newtab 工作台完成渲染且 onboarding 状态为 `pending` 后自动启动交互式引导。
- [x] 3.3 将 Driver.js 完成动作映射到 `markOnboardingCompleted`，将跳过/关闭动作映射到 `markOnboardingSkipped`。
- [x] 3.4 当 onboarding 状态无法保存时，保留当前降级持久化行为。
- [x] 3.5 将“重新查看新手引导”接入 Driver.js 交互式引导重启逻辑，且不把 completed/skipped 状态改回 pending。
- [x] 3.6 对不可用的引导目标执行跳过或回退到可见 onboarding 面板，且不阻塞工作台初始化。

## 4. 测试和检查

- [x] 4.1 更新 newtab UI 测试，断言 Driver.js 集成、稳定引导目标、完成/跳过接线和重新查看接线。
- [x] 4.2 更新 background/install 测试，保持首次安装 `pending` 行为；仅在 onboarding URL 变化时更新预期。
- [x] 4.3 新增或更新检查测试，覆盖本地 Driver.js 资源、保留 license 文本、无 CDN 引用、无 Intro.js/AGPL 依赖。
- [x] 4.4 更新发布就绪测试，覆盖交互式 onboarding 和仅使用本地 MV3 资源。
- [x] 4.5 运行 `npm test` 并修复失败。
- [x] 4.6 运行 `npm run check` 并修复失败。
- [x] 4.7 运行 `npm run build`，确认 `dist/` 包含本地 Driver.js 资源。

## 5. 手动验收

- [ ] 5.1 在 Chrome 中以全新扩展安装方式加载 `dist/`，验证新标签页会打开 Driver.js 交互式引导。
- [ ] 5.2 验证完成引导后，后续打开 newtab 不会自动重复展示。
- [ ] 5.3 验证跳过或关闭引导后，后续不会自动重复展示；如果状态持久化失败，应显示合适状态消息。
- [ ] 5.4 验证“重新查看新手引导”入口能在完成或跳过后重新启动交互式引导。
- [ ] 5.5 执行纯键盘走查，覆盖下一步、上一步、跳过、完成和引导结束后的焦点返回。
- [ ] 5.6 执行窄宽度和 200% 缩放检查，确认弹出说明和工作台控件不会发生不合理重叠。
