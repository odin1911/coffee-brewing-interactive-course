# 课程 JSON 替换前后对比

日期：2026-07-14

## 结果

活动课程已从“咖啡冲煮入门”切换为“家庭防灾入门”。替换前 JSON 完整保存在 `fixtures/course-coffee.json`，与 Git 中替换前的 `public/course.json` 字节一致。`src/` 无任何改动。

| 对比项 | 替换前 | 替换后 |
|---|---|---|
| 课程 ID | `coffee-brewing-101` | `weather-safety-101` |
| 标题 | 咖啡冲煮入门 | 家庭防灾入门 |
| 主讲人 | 冲煮手记 | 应急手记 |
| 主色 / 强调色 | `#4A2C1A` / `#D89A4E` | `#17324D` / `#D78B3C` |
| 背景 / 正文 | `#F7F0E5` / `#2B211B` | `#EEF4F7` / `#17212B` |
| 品牌图标 | 本地咖啡豆 `assets/logo.svg` | HTTPS 安全盾牌图标 |
| 页面定义 | 9 页 | 2 页 |
| 页面类型 | cover、content、chart、quiz、cta | cover、cta |
| 图表明细 | 6 项 | 0 项 |
| 封面标题 | 把变量，冲成一杯可重复的风味。 | 先准备，再应对。 |
| 下一步标签 | 下一页 | 下一项 |
| 工具入口 | 打开工具页 | 打开检查工具 |
| PDF 按钮 | 导出 PDF | 导出防灾手册 |
| CTA | 再冲一杯 | 重新查看 |

## 文件边界

- 运行时只读取新的 `public/course.json`。
- 原咖啡课程保存在 `fixtures/course-coffee.json`，附录 A 测试继续读取该文件。
- `fixtures/course-alt.json` 保留故意缺失图片的素材错误测试；活动课程移除了该可选坏图，因此网页和 PDF 不会被它阻断。
- `public/sources.json` 已同步为家庭防灾课程来源说明。
- `src/` 改动文件数：0。

## 验证

- 聚焦替换测试：3 个文件、13 项全部通过。
- 全量测试：7 个文件、38 项全部通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。
- `git diff --check`：通过。
- 替换前备份与 Git 原文件比较：完全一致。
