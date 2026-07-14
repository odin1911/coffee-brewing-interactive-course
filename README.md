# 咖啡冲煮入门交互课件

这是一个由 JSON 驱动的中文交互课程。示例课程遵循考题附录 A：配置包含 9 个页面定义，任一答题分支经过 8 页，两张图表支持配置式钻取。

## 当前状态

阶段 0–8 已完成：课程运行时、穿插式答题、图表明细、工具页、本地增量记录、完整打印和替换课程校验均已实现。JSON 驱动修复增加了附录 A 内容校验、远程图片和打印前图片检查。

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
- `/print`：全部页面定义、分支和图表明细；确认所有图片加载后再调用浏览器打印。生成的 PDF 已包含图片，离线打开不需要联网。

## 替换课程

只修改 `public/course.json`、不修改任何代码，即可更换课程文字、品牌、图片、页序、图表、分支和 CTA。页面类型支持 `cover`、`content`、`chart`、`quiz`、`cta`。

图片地址支持站内路径、HTTPS 远程图片和 base64 raster `data:image/...`。若要求只交付一个 JSON，使用 HTTPS 或 data 图片；使用新的站内路径时仍需把对应文件放入 `public/`。远程图片服务器必须允许公开访问；页面使用 `no-referrer` 请求，导出时若任何图片失败会阻止打印并显示失败地址。地址中的反斜杠会被拒绝，避免浏览器把伪装的站内路径解释成远程地址。

### JSON 字段

- `course`：`id`、`version`、`title`、`presenter` 和 `brand`。
- `brand`：必填 `primary`、`accent`、`background`、`text`、`logo`；可选 `surface`、`muted`、`line`、`chartColors`。颜色使用 `#RGB` 或 `#RRGGBB`，正文/标题/次要文字与浅色表面的组合必须达到 `4.5:1`。
- `ui`：导航、选择、统计、图表明细、打印和图片错误等可见标签。
- `slides[]`：通用字段为 `id`、`type`、可选 `kicker` 和 `next`；数组顺序决定默认页序。
- `cover`：`title`，以及可选 `subtitle`、`topics`、`image`、`imageAlt`。
- `content`：`title`、`bullets`，以及可选 `image`、`imageAlt`。
- `chart`：`title` 和 `chart.kind/unit/clickable/series[]`；`series` 不得为空，每项包含 `label`、非负有限数值 `value`、指向自有 `details` 项的 `detail`。
- `quiz`：`question`、可选 `description` 和 `options[]`；每项包含 `id`、`text`、`goto`、可选的非负整数 `initialVotes`。
- `cta`：`title`、`body`、`action.label`、`action.href`。
- `details`：图表明细表；每项包含 `title` 和 `facts[]`。

CTA 允许站内/相对地址、页内锚点、HTTPS、`mailto:` 和 `tel:`。配置加载时会拒绝 HTTP 图片、HTTP CTA、脚本协议、反斜杠地址、低对比度品牌色和悬空的页面/明细引用。

替换后运行 `npm test` 和 `npm run build`。`fixtures/course-alt.json` 是非咖啡课程的零代码替换证明；工具页只检查站内素材，远程图片在实际加载和打印前检查。

`public/sources.json` 保存课程文案和素材（包括远程图片 URL）的来源审计信息；当前示例内容标注为 AI 生成。

## 验证

```bash
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
