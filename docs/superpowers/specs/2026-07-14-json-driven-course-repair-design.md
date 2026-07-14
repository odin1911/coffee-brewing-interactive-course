# JSON 驱动课程修复设计

日期：2026-07-14

## 1. 背景

当前课件能从 `public/course.json` 加载主要内容，但仍存在三类偏差：示例课程没有完整遵循考题附录 A；部分 JSON 字段存在却未展示或未生效；页面仍包含咖啡主题硬编码文案和固定品牌色。上述问题会使现场只替换 JSON 时出现旧课程残留。

本批次采用“复用现有 JSON，删除冗余硬编码文案”的最小方案，并允许适度扩展 JSON 保存确有必要的可见内容。

## 2. 目标

- 以附录 A 为课程内容和页序基准，以附录 B 为最小字段语义基准。
- `/course` 与 `/print` 的课程文字、交互标签、图片地址、品牌色、页面顺序、图表数据和 CTA 行为均由 JSON 控制。
- 只替换 `public/course.json`，不修改代码，即可放映另一门完全不同的课程。
- 支持本地图片、HTTPS 远程图片和 `data:image/...` 图片。
- 打印前等待图片加载完成；导出的 PDF 包含图片数据，之后离线打开不需要联网。
- 用自动化测试和 review 文档明确记录修复前问题与修复后结果。

## 3. 非目标

- `/tools` 的通用引擎说明不属于课程内容，可以保留固定文案。
- 不实现任意 HTML、脚本、模板表达式或通用页面搭建器。
- 不保证远程图片在断网后仍能重新加载到网页；只保证已成功加载的图片进入导出的 PDF。
- 不支持需要登录、短期签名或禁止外链的远程图片。

## 4. 数据设计

保留现有 `course`、`ui`、`slides` 和 `details` 结构，不另建配置层。

### 4.1 品牌

`course.brand.primary`、`accent`、`background`、`text` 和 `logo` 保持原语义。页面把这四种颜色注入 CSS 变量，不再固定为咖啡配色。

可按实际需要增加以下可选字段：

- `surface`：内容卡片背景；缺失时从 `background` 派生。
- `muted`：次要文字；缺失时从 `text` 与 `background` 派生。
- `line`：边框颜色；缺失时从 `primary` 与 `background` 派生。
- `chartColors`：图表数据色数组；缺失时使用 `primary`、`accent` 和 `text`。

派生值必须只依赖当前 JSON 的品牌色，不能回退到咖啡主题常量。

### 4.2 界面文案

优先复用现有 `ui` 字段：`previous`、`next`、`continue`、`showDetail`、`closeDetail`、`exportPdf`、`openTools`、`recordStatus`、`restartCourse` 和 `validationResult`。确有可见用途但现有字段无法表达时，才增加简短字段：`backToCourse`、`select`、`selected`、`results`、`peopleUnit` 和 `imageLoadError`。

不再展示的装饰文字直接删除，不为其增加配置。页码只显示数字，避免引入模板语法。

### 4.3 页面内容

页面继续由 `slides` 数组和显式 `next` / `goto` 决定顺序。允许所有页面增加可选 `kicker`；封面可增加 `topics`；答题页可增加 `description`。字段缺失时对应区域不渲染，不使用代码内默认课程文案。

示例课程按附录 A 调整为：

1. 封面。
2. 三大产区与风味。
3. 咖啡因含量图表及钻取。
4. 手冲基本步骤。
5. 互动答题及即时统计。
6. 入门建议或进阶建议。
7. 萃取率图表及钻取。
8. 总结与 CTA。

配置仍包含九个页面定义，两条实际分支各经过八页。

### 4.4 图片地址

图片字段接受三类值：

- 站内绝对或相对路径。
- `https://` 远程地址。
- base64 raster `data:image/png|jpeg|webp|gif|avif` 数据地址。

拒绝 `http://`、`javascript:`、反斜杠路径、非 raster/base64 data URL 和其他协议。远程图片使用 `referrerPolicy="no-referrer"`，不设置会导致普通跨域图片失败的 `crossOrigin`。

本地素材继续由工具页检查；远程素材通过图片加载结果判断。打印操作等待所有打印页图片完成 `load` 和 `decode`。任何图片失败时不调用打印，并显示失败地址。

## 5. 渲染行为

- `/course` 顶部显示 JSON 的课程标题、主讲人和品牌 Logo。
- 页面标题、正文、图片、图表值、单位、选项、统计和明细完整来自当前 slide 或 detail。
- `chart.clickable` 为 `true` 时允许点击钻取；为 `false` 时只展示静态图表。
- CTA 使用 `action.label` 和 `action.href`，不再固定重置课程。
- `/print` 使用同一品牌变量，包含课程标题、主讲人、Logo、全部页面定义、两个分支、所有明细和 CTA 内容。
- 打印工具栏使用 JSON 的导出标签；工具页本身不进入 PDF。

## 6. 校验与安全

课程校验继续拒绝重复页面 ID、无效 `next`、`goto` 和 `detail`。本批次增加：

- 品牌色和 `chartColors` 只接受 `#RGB` 或 `#RRGGBB`，避免浏览器与测试环境产生不同解释。
- `text`、`primary`、`muted` 与 `background` / `surface` 的普通文字组合必须达到 `4.5:1`；浅色焦点使用 `text`，深色表面焦点使用 `background`。
- 图片 URL 必须符合允许的三类地址。
- 新增可见文案字段存在时必须是非空字符串；数组项不得为空。
- 图表序列不得为空，数值必须有限且非负；明细引用只接受 `details` 自有属性；初始票数必须是非负整数。
- CTA `href` 只允许站内路径、`https://`、`mailto:` 和 `tel:`，拒绝脚本协议。

配置错误继续阻止放映并给出字段路径，不静默使用旧课程默认值。

## 7. 修复证据

先编写失败测试并保存失败输出摘要到 review 文档，再修改实现。最小证明包括：

- 示例课程标题与页序符合附录 A。
- 备用课程 JSON 渲染后不出现咖啡课程专属文案或颜色。
- 页面输出包含 JSON 的单位、交互标签、远程图片地址和 CTA 地址。
- `clickable: false` 不产生钻取行为。
- 打印输出包含品牌信息、两条分支、全部明细和 CTA。
- 非法图片与 CTA 协议被拒绝。
- 图片未加载完成或加载失败时不会提前打印。

review 文档位于 `docs/reviews/2026-07-14-json-driven-course-review.md`，记录问题、修复文件、RED/GREEN 证据和最终验收结论。

## 8. 活文档同步

同一批次更新：

- `README.md`：JSON 字段、远程图片、换课步骤和验证方式。
- `docs/skills/Contract.md`：只改 JSON 换课、可见课程内容边界、允许的远程图片及打印等待规则。
- `DESIGN.md`：颜色改为 JSON 主题令牌，保留对比度和布局约束。
- 原设计规格与实施计划：同步已经改变的运行时远程素材策略和验证范围。
- review 文档：保存修复前后证据。

## 9. 验收标准

- `npm test` 全部通过。
- `npm run build` 成功。
- 当前咖啡课程两条路径均为八页且符合附录 A。
- 备用课程只替换 JSON 即可改变课程文字、品牌色、图片、图表和 CTA，无咖啡内容残留。
- HTTPS 图片成功加载后进入 PDF；导出的 PDF 离线打开仍显示图片。
- 图片失败时导出被阻止并显示明确错误。
- review、README、Contract、DESIGN、原规格和实施计划与实现一致。
