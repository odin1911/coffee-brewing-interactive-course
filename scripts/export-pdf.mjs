#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, open, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const output = join(root, 'exports', 'course.pdf');

export function chromeArguments(outputPath, url) {
  return ['--headless=new', '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=5000', `--print-to-pdf=${outputPath}`, url];
}

export async function hasPdfHeader(file) {
  let handle;
  try {
    handle = await open(file, 'r');
    const header = Buffer.alloc(5);
    const { bytesRead } = await handle.read(header, 0, 5, 0);
    return bytesRead === 5 && header.toString() === '%PDF-';
  } catch {
    return false;
  } finally {
    await handle?.close();
  }
}

async function main() {
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  if (build.status !== 0) throw new Error('项目构建失败');

  const port = await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      probe.close(() => resolve(address.port));
    });
  });
  const server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  const stop = () => { if (server.exitCode === null) server.kill('SIGTERM'); };
  const interrupt = () => { stop(); process.exit(130); };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);

  try {
    const url = `http://127.0.0.1:${port}/print`;
    let ready = false;
    for (let attempt = 0; attempt < 50 && !ready; attempt += 1) {
      if (server.exitCode !== null) throw new Error('临时服务启动失败');
      try { ready = (await fetch(url)).ok; } catch { /* 服务仍在启动 */ }
      if (!ready) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('等待打印页面超时');

    await mkdir(dirname(output), { recursive: true });
    await rm(output, { force: true });
    const printed = spawnSync(chrome, chromeArguments(output, url), { stdio: 'inherit' });
    if (printed.error?.code === 'ENOENT') throw new Error('未找到 Google Chrome');
    if (printed.status !== 0) throw new Error('Chrome 导出失败');
    if (!await hasPdfHeader(output)) throw new Error('导出文件不是有效 PDF');
    console.log(`PDF 已导出：${output}`);
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
    stop();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(async (error) => {
    await rm(output, { force: true });
    console.error(`PDF 导出失败：${error.message}`);
    process.exitCode = 1;
  });
}
