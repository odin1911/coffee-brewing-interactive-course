# 咖啡冲煮入门交互课件

这是一个由本地 JSON 驱动的中文交互课程。教学路径保持 8 页；配置文件包含 9 个定义，答题分支和两张可点击图表由同一份 JSON 驱动。

## 当前状态

阶段 0–8 已完成：课程运行时、穿插式答题、图表明细、工具页、本地增量记录、完整打印和替换课程校验均已实现。当前工作区保留实现改动，尚未自动提交或合并。

## 运行

```bash
npm install
npm run dev
```

`npm run dev` 是纯静态教学预览，记录功能自动降级。需要本地增量记录时运行：

```bash
npm run local
```

本地服务会在 `records/` 为每次课程运行新建一个 JSON 文件，并在页面离开、答题、图表明细操作发生时立即更新。

## 页面

- `/course`：教学内容、答题分支和图表钻取。
- `/tools`：记录状态、素材校验和完整打印入口，不属于教学路径。
- `/print`：9 个页面定义、两条分支和全部图表明细，使用浏览器打印导出 PDF。

## 替换课程

只需替换 `public/course.json` 和本地 `public/assets/` 素材；页面类型支持 `cover`、`content`、`chart`、`quiz`、`cta`。替换后运行 `npm test`，工具页会显示缺失素材路径。

`public/sources.json` 保存课程文案和素材的来源审计信息；当前示例内容标注为 AI 生成。

## 验证

```bash
npm test
npm run build
```

设计约束见 [DESIGN.md](./DESIGN.md)，硬约束见 [docs/skills/Contract.md](./docs/skills/Contract.md)。

## 文件与目录职责

- `public/course.json`：运行时课程配置；`public/assets/`：本地图片与标记素材。
- `public/sources.json`：课程事实和本地素材的来源审计清单。
- `src/`：课程加载/校验、导航状态、记录器、页面渲染与样式。
- `server/`、`server.mjs`：本地记录 API 与每次运行一个 JSON 文件的原子写入。
- `tests/`：课程契约、导航、记录、替换课程和服务端存储测试。
- `fixtures/`、`examples/`：替换课程与学习记录示例。
- `docs/`、`DESIGN.md`：硬约束、规格、计划与视觉契约。
- `records/`：本地运行时生成的会话文件（已被 Git 忽略）。
