# 家庭防灾课程替换与对比设计

日期：2026-07-14

## 目标

把当前运行课程从“咖啡冲煮入门”替换为现有的“家庭防灾入门”，证明运行时只需替换 `public/course.json`，无需修改引擎代码。同时保留替换前 JSON，便于后续逐字段比较或恢复。

## 文件变化

- 将替换前的 `public/course.json` 原样保存为 `fixtures/course-coffee.json`。
- 将现有 `fixtures/course-alt.json` 原样复制为新的 `public/course.json`。
- 不修改 `src/` 下任何运行时代码。
- 将只适用于附录 A 咖啡内容、咖啡图表和打印文案的测试改为读取 `fixtures/course-coffee.json`，避免活动课程换成其他主题后产生错误失败。另以通用测试验证活动 `public/course.json` 可加载且与家庭防灾 fixture 一致。

## 对比范围

完成后输出以下前后差异：

- 课程 ID、标题、主讲人和品牌色。
- 页面数量、页面类型、标题和 CTA。
- 导航、工具、打印及答题标签。
- 详情数量和课程专属词残留。
- 自动测试、生产构建和 Git 改动范围。

## 验收标准

- `public/course.json` 为“家庭防灾入门”。
- `fixtures/course-coffee.json` 与替换前课程 JSON 完全一致。
- `src/` 没有任何改动。
- 活动课程静态渲染不出现咖啡课程专属文案或颜色。
- `npm test`、`npm run build` 和 `git diff --check` 全部通过。
