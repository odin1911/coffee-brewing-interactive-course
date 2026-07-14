# JSON 驱动课程 Review

日期：2026-07-14  
依据：考题附录 A、附录 B，以及项目“只修改 `public/course.json` 即可完全换课”的约束。

## 修复前问题

| ID | 问题 | 修复前影响 | 修复前位置 |
|---|---|---|---|
| R1 | 第 2 页不是“三大产区与风味” | 示例课程不符合附录 A | `public/course.json` 的 `taste` 页面 |
| R2 | 手冲步骤排在咖啡因图表之前 | 页序不符合附录 A | `taste -> steps -> chart` |
| R3 | 课程可见文案硬编码 | 换成其他课程后仍出现“风味、变量、记录”等咖啡文案 | `src/main.tsx` |
| R4 | 品牌颜色硬编码 | 替换 JSON 配色不改变页面主题 | `src/styles.css` |
| R5 | 多个 `ui` 字段未展示 | JSON 文案与实际控件脱节 | `src/main.tsx` |
| R6 | `chart.clickable` 未生效 | 配置为不可点击时仍可钻取 | `src/main.tsx` 的 `ChartView` |
| R7 | `action.href` 未生效 | CTA 固定重置课程，不能由 JSON 控制去向 | `src/main.tsx` 的课程导航 |
| R8 | 图表单位在课程页不可见 | 图表数据语义展示不完整 | `src/main.tsx` 的柱形数值 |
| R9 | 打印页缺少主讲人、Logo 和 CTA 操作 | PDF 与网页课程内容不一致 | `src/main.tsx` 的 `PrintPage` |
| R10 | 图片只支持本地路径，打印不等待远程图片 | 远程图片可能被错误改写，PDF 可能缺图 | `assetUrl` 与打印按钮 |
| R11 | 图片与 CTA 协议未校验 | 不能明确拒绝不安全或不受支持的地址 | `src/course.ts` |
| R12 | 现有测试只验证结构和路径 | 上述问题仍可在 20/20 测试通过时存在 | `tests/` |

## RED evidence

- `npm test -- --run tests/course-data.test.ts`：1 项失败、1 项通过。
- 失败符合预期：实际 ID/顺序为 `cover, taste, steps, chart...`，期望为 `cover, beans, caffeine, steps...`。

## Fixes

| 问题 | 修复 | 自动证明 |
|---|---|---|
| R1–R2 | 将 `taste`/`chart` 修正为 `beans`/`caffeine`，补齐三大产区内容并调整顺序 | `tests/course-data.test.ts` 锁定 9 个定义及两条 8 页路径 |
| R3、R5 | `kicker`、`topics`、答题说明、选择/统计/导航标签改由 JSON 输出；引擎固定文案去除咖啡品牌名 | 备用课程静态渲染不含咖啡课程文案 |
| R4 | `courseTheme()` 将 JSON 品牌色映射为 CSS 变量，柱色读取 `chartColors` | CSS 变量断言及备用课程主题断言 |
| R6 | `chart.clickable: false` 禁用钻取并隐藏详情 | 静态图表渲染测试 |
| R7 | CTA 改为使用 `action.label` 和 `action.href` 的链接 | 课程与打印渲染测试 |
| R8 | 柱形数值直接显示配置单位 | 图表渲染测试断言 `63mg` |
| R9 | 打印页增加课程标题、主讲人、Logo、封面 topics 和 CTA 链接 | `PrintPage` 静态输出测试 |
| R10 | `assetUrl()` 支持本地、HTTPS 和 raster data 图片；打印等待 `load`/`decode` | deferred decode 和失败地址测试 |
| R11 | 共享校验拒绝 HTTP、脚本协议、带空白地址、无主机 HTTPS 和非图片 data URL | `tests/course.test.ts` 安全边界测试 |
| R12 | 新增渲染、主题、图片等待和附录 A 回归测试 | 测试数从 20 增至 29 |

## GREEN evidence

- `npm test`：7 个测试文件、29 项测试全部通过。
- `npm run build`：TypeScript 检查通过，Vite 生产构建成功。
- `git diff --check`：退出码 0，无空白错误。
- 定向 RED/GREEN 已分别观察：附录 A 页序、JSON 渲染、主题变量、图片等待和地址安全边界均先失败后通过。

## 尚未自动证明的项目

- 浏览器实际打印生成的 PDF 是否逐页无裁切。
- 实际 PDF 文件在完全断网环境下的图片显示；实现已等待图片加载，但本批次未生成 PDF 文件做离线复验。
- 具体第三方图片服务器是否允许外链及长期可用。
