# README JSON 与架构说明设计

日期：2026-07-14

## 目标

README 需要直接说明项目如何满足“内容与代码完全分离”，并让评审能快速找到 JSON 格式、字段职责和现场换课验证方法。

## 文档顺序

README 按使用者关注顺序组织：

1. 项目简介
2. JSON 配置格式
3. JSON 驱动架构
4. 启动与导出
5. 页面、验证和目录职责

JSON 章节放在项目简介之后。README 不复制完整课程样例，避免与实际配置漂移；字段表直接链接 `public/course.json`、咖啡参考配置和非咖啡替换配置。

## JSON 配置格式

字段表逐项说明：

- `course` 和 `brand`：课程身份、讲师、Logo 与品牌配色
- `ui`：导航、答题、图表明细和导出标签
- `slides[]`：全部课程文字、页面类型及数组顺序
- `next` 和 `options[].goto`：顺序导航与答题分支
- `chart.series` 和 `details`：图表数据与钻取明细
- `image` 和 `logo`：本地、HTTPS 或 data 图片
- `action`：结束页按钮文字与目标地址

章节保留各页面类型的必填、可选字段和地址校验规则。

## JSON 驱动架构

架构说明按运行链路展开：

1. 浏览器只加载 `public/course.json`，不从组件读取课程专用内容
2. `src/course.ts` 校验字段、颜色、图片地址、跳转目标和明细引用
3. React 根据 `slides[].type` 选择通用渲染器
4. `src/session.ts` 根据数组顺序、`next` 和 `goto` 控制流程
5. JSON 品牌色转换为 CSS 变量，图表直接读取 JSON 数据
6. `/course` 与 `/print` 复用同一个已校验配置对象

架构章节明确区分课程配置与通用引擎。课程专用文字、图表数据、页面顺序、图片和品牌配色属于 JSON；代码只处理校验、渲染、导航、记录和导出。

## 现场验证

README 提供最短验证方法：用 `fixtures/course-alt.json` 覆盖 `public/course.json`，刷新页面，确认课程标题、文字、配色、页面数量和类型均改变，且 `src/` 不需要修改。验证结束后可用 `fixtures/course-coffee.json` 恢复示例课程。

## 范围

本次只重组和补充 README，不修改 JSON 格式、运行时代码或测试行为。
