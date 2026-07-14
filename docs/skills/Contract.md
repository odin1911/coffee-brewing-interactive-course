# 项目硬约束

## 活文档同步

文档是项目交付物，不是一次性说明。任何代码、配置、目录或产品决策变更，只要使下列文档不再准确，就必须在同一批次同步更新，不得留到项目结束时补写：

- `README.md`：当前状态、启动/构建/测试/导出方式、配置使用方式、文件与目录职责。
- `docs/skills/Contract.md`：新发现或变更的产品、技术、数据与验收硬约束。
- `DESIGN.md`：已采用的视觉令牌、布局、组件行为或无障碍规则。
- `docs/superpowers/specs/`：经用户确认的需求、范围或架构发生变化时更新。
- `docs/superpowers/plans/`：实现顺序、目标文件或验证方式发生变化时更新。
- `task_plan.md`、`findings.md`、`progress.md`：使用文件规划流程期间，及时记录阶段状态、关键发现与验证证据。

完成任何开发批次前，必须检查实现与上述文档是否一致；不一致即视为该批次未完成。
# Contract

- Runtime course content is loaded from `public/course.json`; replacing only this JSON must allow a completely different course without code changes.
- All visible course and print text, interaction labels, image addresses, brand colors, slide order, chart data, and CTA behavior come from the active JSON. Generic `/tools` engine copy is outside this boundary.
- Course slides contain teaching only. Export, recording status, restart, and validation live under `/tools`.
- `/print` renders all configured branches and chart details; `/tools` never appears in the PDF.
- Local recording writes one server-generated JSON file per course run; static deployment disables recording.
- No runtime AI request, remote font, remote non-image content, state library, or chart library. Configured public HTTPS images are the only remote-content exception.
- Images accept local paths, HTTPS URLs, or base64 raster data URLs. HTTP, executable protocols, backslash paths, and non-image data URLs are rejected.
- Printing waits for every configured image to load and decode. A failed image blocks printing with its address; a successfully exported PDF contains its image data and opens offline.
- Light surfaces set explicit dark foreground colors. Normal text contrast is at least 4.5:1.
- The preserved `fixtures/course-coffee.json` reference course follows Appendix A: 9 definitions provide two 8-page branches in the order cover, regions, caffeine, steps, quiz, branch, extraction, CTA. The active `public/course.json` may be any valid replacement course.
- Chart data is native button/CSS UI. Series are non-empty with finite non-negative values; every drill-down id must be an own top-level `details` entry. Quiz initial votes are non-negative integers.
- The `/course` route contains teaching only; `/tools` and `/print` are separate routes.
- `public/sources.json` records the origin of every course fact and image, including remote image URLs.
- Missing local assets are reported on `/tools` with a repairable path; they do not silently render broken images.
- `npm run export:pdf` builds, starts a temporary local server, writes the course-neutral `exports/course.pdf`, and stops the server without browser interaction.
