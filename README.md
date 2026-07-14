# JSON 驱动互动课件

这是一个由 JSON 驱动的中文互动课件。当前示例课程为“咖啡冲煮入门”，包含课程播放、答题分支、图表明细、学习记录和 PDF 导出；只修改 `public/course.json` 即可替换为另一门课程。

## JSON 配置格式

`public/course.json` 是课件内容的唯一运行时来源。只修改该文件即可更换课程文字、品牌、图片、页序、图表、分支和结束页操作，不需要修改 `src/`。

配置由四个顶层字段组成：

- `course`：课程身份信息，以及 `brand` 品牌配置。
- `ui`：导航、答题、图表明细、打印和图片错误等交互标签。
- `slides[]`：页面定义；数组顺序决定默认页序。
- `details`：图表点击钻取的明细数据表。

字段结构如下：

- `course`：必填 `id`、`version`、`title`、`presenter` 和 `brand`。
- `brand`：必填 `primary`、`accent`、`background`、`text`、`logo`；可选 `surface`、`muted`、`line`、`chartColors`。颜色使用 `#RGB` 或 `#RRGGBB`，正文、标题和次要文字与浅色表面的对比度不得低于 `4.5:1`。
- `slides[]`：通用字段为 `id`、`type`、可选 `kicker` 和 `next`。
- `cover`：必填 `title`；可选 `subtitle`、`topics`、`image`、`imageAlt`。
- `content`：必填 `title`、`bullets`；可选 `image`、`imageAlt`。
- `chart`：必填 `title` 和 `chart.kind/unit/clickable/series[]`；每项数据包含 `label`、非负有限数值 `value`、指向 `details` 的 `detail`。
- `quiz`：必填 `question`、`options[]`；可选 `description`；每个选项包含 `id`、`text` 和 `goto`。
- `cta`：必填 `title`、`body`、`action.label`、`action.href`。
- `details`：每项包含 `title` 和 `facts[]`。

图片支持站内路径、HTTPS 地址和 base64 raster `data:image/...`。CTA 支持站内或相对地址、页内锚点、HTTPS、`mailto:` 和 `tel:`。配置加载时会拒绝 HTTP 图片、HTTP CTA、脚本协议、反斜杠地址、低对比度品牌色和悬空的页面或明细引用。

完整配置参考：[当前课程](./public/course.json)、[咖啡课程样例](./fixtures/course-coffee.json)和[非咖啡课程样例](./fixtures/course-alt.json)。`public/sources.json` 记录课程文案和图片的来源。

修改 JSON 后先运行配置校验：

```bash
npm run validate:course
```

该命令直接加载并校验当前 `public/course.json`。JSON 语法错误、必填字段缺失、非法颜色或地址、悬空的页面跳转和图表明细引用都会使命令失败。`npm run build`、`npm start` 和 `npm run export:pdf` 会自动执行同一项校验。

## JSON 驱动架构

代码只实现通用课件引擎，课程专用内容全部由 `public/course.json` 提供：

| 硬性要求 | JSON 字段 | 实现方式 |
|---|---|---|
| 全部课程文字 | `course`、`ui`、`slides[]`、`details` | React 组件只读取已校验配置，不导入课程专用文案 |
| 图表数据与明细 | `chart.series`、`details` | 通用图表组件按数据生成图形，并通过 `detail` 查找钻取内容 |
| 页面顺序与分支 | `slides[]`、`next`、`options[].goto` | 数组顺序控制默认流程，`next` 和 `goto` 控制显式跳转 |
| 品牌配色与图片 | `brand`、`image`、`logo` | 品牌色转换为 CSS 变量，图片地址由通用素材函数解析 |
| 完整打印版 | 同一份完整配置 | `/course` 与 `/print` 复用同一个配置对象，不维护第二份内容 |

运行链路如下：

1. 浏览器从 `/course.json` 加载配置，`cache: no-store` 确保刷新后读取最新内容。
2. `src/course.ts` 校验字段类型、颜色对比度、图片地址、页面跳转和明细引用；无效配置停止渲染并显示错误。
3. `src/main.tsx` 根据 `slides[].type` 选择 `cover`、`content`、`chart`、`quiz` 或 `cta` 通用渲染器。
4. `src/session.ts` 根据数组顺序、`next` 和 `goto` 计算下一页，不包含固定课程路径。
5. `/print` 遍历同一份 `slides[]`，同时展开所有答题分支和图表明细。

答题页由主讲人根据台下回答重复加票，并可减票纠错；票数和百分比从 0 开始即时计算。只有一个选项票数最高时才允许继续，并按该选项的 `goto` 进入后续分支；零票或平票时继续按钮不可用。

现场换课时，用另一门课程配置覆盖 `public/course.json` 并刷新页面，即可同时替换标题、文字、品牌、页面数量、图表和分支。仓库使用 `fixtures/course-alt.json` 验证非咖啡课程可以通过相同代码完成加载、渲染和打印。

## 一键启动（现场放映）

运行前需要 Node.js 24 或更高版本及 npm。首次使用先安装依赖：

```bash
npm install
```

现场放映使用一条命令构建并启动完整课件：

```bash
npm start
```

`npm start` 先执行 TypeScript 检查和 Vite 生产构建，再由 `server.mjs` 提供课件与学习记录 API。默认打开 `http://localhost:4173/course`；可通过 `PORT` 环境变量修改端口。`npm run local` 是同一命令的兼容别名。

可直接访问：

- `/course`：播放课件。
- `/tools`：检查素材并进入导出页面。
- `/print`：查看完整打印版。

## 开发与静态预览

开发课程时启动 Vite 开发服务：

```bash
npm run dev
```

按终端显示的地址打开 `/course`。Vite 默认使用 `http://localhost:5173`，端口被占用时会自动选择其他端口。该模式不启动学习记录 API。

只预览已有生产构建时运行：

```bash
npm run build
npm run preview
```

## 学习记录

`npm start` 会同时启动学习记录 API。每次打开课程都会在 `records/` 新建一个 JSON 文件，并在页面离开、答题或打开图表明细时持续更新。

如果日志服务未启动，前端仍正常运行；首次创建记录失败后，当前页面会停止继续发送日志，不生成记录文件，也不会自动重试。启动日志服务后刷新 `/course` 即可重新连接。

## 导出 PDF

macOS 安装 Google Chrome 后，运行一条命令即可构建课程并导出完整打印版：

```bash
npm run export:pdf
```

文件输出到 `exports/course.pdf`。命令会自行启动并关闭临时服务。

## 页面

- `/course`：教学内容、答题分支和图表钻取。
- `/tools`：记录状态、素材校验和完整打印入口，不属于教学路径。
- `/print`：全部页面定义、分支和图表明细；确认所有图片加载后再调用浏览器打印。生成的 PDF 已包含图片，离线打开不需要联网。

## 验证

```bash
npm run validate:course
npm test
npm run build
```

设计约束见 [DESIGN.md](./DESIGN.md)，硬约束见 [docs/skills/Contract.md](./docs/skills/Contract.md)。

## 文件与目录职责

- `public/course.json`：运行时课程配置；`public/assets/`：可选的本地图片与标记素材。
- `public/sources.json`：课程事实和本地素材的来源审计清单。
- `src/`：课程加载/校验、导航状态、记录器、页面渲染与样式。
- `server/`、`server.mjs`：本地记录 API 与每次运行一个 JSON 文件的原子写入。
- `tests/`：课程契约、导航、记录、替换课程和服务端存储测试。
- `fixtures/`、`examples/`：替换课程与学习记录示例。
- `docs/`、`DESIGN.md`：硬约束、规格、计划与视觉契约。
- `records/`：本地运行时生成的会话文件（已被 Git 忽略）。
- `scripts/export-pdf.mjs`：本地一键 PDF 导出脚本；`exports/course.pdf`：纳入 Git 跟踪的正式交付 PDF。

## AI 执行约束

本仓库为 AI 辅助设计、开发和验证提供项目内上下文。AI 在分析或修改项目之前，应按以下顺序读取约束：

1. [AGENTS.md](./AGENTS.md)：工作语言、调查方式、最小验证和禁止事项。
2. [Contract.md](./docs/skills/Contract.md)：内容边界、JSON 契约、交互、素材、运行和交付硬约束。
3. [DESIGN.md](./DESIGN.md)：视觉令牌、布局、组件行为和无障碍规则。
4. [设计规格](./docs/superpowers/specs/)与[实施计划](./docs/superpowers/plans/)：已确认的需求边界、架构决策、目标文件和验证方式。

功能开发遵循“约束 → 规格 → 计划 → 测试 → 实现 → 验证”的流程：

| 阶段 | 产物或规则 | 使用的核心 Skill |
|---|---|---|
| 需求与设计 | 修改功能前先澄清边界，并在 `docs/superpowers/specs/` 形成经确认的规格 | `brainstorming`、`reference-design-contract`、`frontend-design` |
| 实施准备 | 根据规格在 `docs/superpowers/plans/` 生成可执行计划 | `writing-plans` |
| 开发与修复 | 先写失败测试，再做最小实现；遇到缺陷先定位根因 | `test-driven-development`、`systematic-debugging` |
| 素材与导出 | 图片按设计约束生成，PDF 逐页检查 | `imagegen`、`pdf` |
| 完成交付 | 重新运行 JSON 校验、测试、构建、浏览器主流程和 PDF 检查后才能声明完成 | `verification-before-completion` |
