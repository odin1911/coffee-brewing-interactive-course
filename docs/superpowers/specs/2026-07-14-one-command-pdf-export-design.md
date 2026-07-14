# 一条命令导出 PDF 设计

日期：2026-07-14

## 1. 背景

项目已有完整的 `/print` 页面和 16:9 打印样式，但导出仍依赖浏览器打印对话框。目标是在本机执行一条命令，直接生成 PDF，不要求预先启动服务或操作浏览器。

## 2. 目标

- `npm run export:pdf` 自动构建项目、启动临时服务、导出 PDF 并关闭服务
- 输出固定为与课程内容无关的 `exports/course.pdf`
- 复用现有 `/print` 页面、`server.mjs` 和本机 Google Chrome
- 导出失败时返回非零退出码并说明失败阶段
- 不留下服务进程或无效导出文件
- `exports/course.pdf` 作为正式交付物纳入 Git 跟踪

## 3. 非目标

- 不安装 browser-use、Playwright、Puppeteer 或其他运行依赖
- 不支持线上服务端生成 PDF
- 不支持 Windows、Linux 或没有 Google Chrome 的环境
- 不增加输出路径、纸张尺寸或浏览器路径配置

## 4. 命令流程

`npm run export:pdf` 调用一个 Node.js 脚本。脚本按以下顺序执行：

1. 运行现有 `npm run build`
2. 从本机选择一个空闲端口
3. 使用该端口启动现有 `server.mjs`
4. 轮询 `/print`，直到页面可访问或超时
5. 创建 `exports/`，删除同名旧文件
6. 启动无头 Google Chrome，将 `/print` 直接打印到目标文件
7. 检查进程退出状态，并确认输出以 PDF 文件头开头
8. 在成功或失败路径中关闭临时服务

脚本只使用 Node.js 标准库。Chrome 通过命令行打印页面，不打开系统打印对话框。

## 5. 文件改动

- `scripts/export-pdf.mjs`：编排构建、临时服务、Chrome 打印、文件校验和清理
- `tests/export-pdf.test.mjs`：覆盖 Chrome 参数和 PDF 文件头校验
- `package.json`：增加 `export:pdf` 命令
- `exports/course.pdf`：由脚本生成并纳入 Git 跟踪的正式交付物
- `README.md`：记录一条命令导出方式、输出位置和 Chrome 前置条件
- `docs/skills/Contract.md`：增加本地一键导出的验收约束

现有 `/print` 页面和视觉样式保持不变，因此无需修改 `DESIGN.md`。

## 6. 错误处理

- 构建失败时立即退出，不启动服务
- 临时服务未在超时内就绪时退出并关闭进程
- 未找到标准位置的 Google Chrome 时显示明确错误
- Chrome 返回非零状态或输出不是 PDF 时删除无效文件并退出
- `SIGINT`、`SIGTERM` 和普通异常都触发临时服务清理

## 7. 验证

先运行新增测试并确认它因导出模块不存在而失败，再实现最少代码使测试通过。最终运行：

```bash
npm test
npm run build
npm run export:pdf
```

真实导出验收要求：命令退出码为 0，生成 `exports/course.pdf`，文件头为 `%PDF-`，且命令结束后不再监听临时端口。

## 8. 活文档同步

同一批次更新 `README.md` 和 `docs/skills/Contract.md`。实现不改变产品界面、数据契约或视觉规则，因此不更新 `DESIGN.md` 和既有课程引擎规格。
