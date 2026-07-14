import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import altJson from '../fixtures/course-alt.json';
import courseJson from '../public/course.json';
import { validateCourse } from '../src/course';
import { ChartView, CoursePage, PrintPage, SlideView, waitForImages } from '../src/main';

const altCourse = validateCourse(altJson);
const coffeeCourse = validateCourse(courseJson);
const noop = () => undefined;

describe('JSON-driven presentation rendering', () => {
  it('renders the alternate course without coffee-course copy or colors', () => {
    const cover = altCourse.slides[0];
    const courseHtml = renderToStaticMarkup(
      <SlideView course={altCourse} slide={cover} pageNumber="01" detailId={null} onAnswer={noop} onDetail={noop} onCloseDetail={noop} />
    );
    const printHtml = renderToStaticMarkup(<PrintPage course={altCourse} />);
    const pageHtml = renderToStaticMarkup(<CoursePage course={altCourse} />);

    expect(courseHtml).toContain('先准备，再应对。');
    expect(courseHtml).not.toMatch(/咖啡|冲煮|风味|变量|学习记录/);
    expect(printHtml).toContain(altCourse.course.title);
    expect(printHtml).toContain(altCourse.course.presenter);
    expect(printHtml).toContain(altCourse.course.brand.primary);
    expect(printHtml).toContain(altCourse.ui.exportPdf);
    expect(printHtml).toContain('href="/course"');
    expect(printHtml).not.toMatch(/咖啡|冲煮|风味|变量观察|学习记录/);
    expect(pageHtml).not.toContain('/ 08');
  });

  it('uses JSON-backed theme variables for course and print surfaces', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
    const source = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
    expect(css).toMatch(/\.app-shell\{[^}]*background:var\(--primary\)/);
    expect(css).toMatch(/\.stage\{[^}]*background:var\(--canvas\)/);
    expect(css).toMatch(/\.bar\{[^}]*background:var\(--bar-color/);
    expect(css).toMatch(/\.print-slide\{[^}]*background:var\(--canvas\)/);
    expect(source).not.toContain('冲煮手记');
  });

  it('shows configured chart units and honors clickable false', () => {
    const chart = coffeeCourse.slides.find((slide) => slide.id === 'caffeine');
    if (!chart || chart.type !== 'chart') throw new Error('caffeine chart missing');
    const staticChart = structuredClone(chart);
    staticChart.chart.clickable = false;

    const html = renderToStaticMarkup(
      <ChartView slide={staticChart} course={coffeeCourse} pageNumber="03" detailId="espresso" onDetail={noop} onCloseDetail={noop} />
    );

    expect(html).toContain('63mg');
    expect(html).toContain('disabled');
    expect(html).not.toContain('detail-panel');
  });

  it('prints configured cover topics and CTA action', () => {
    const html = renderToStaticMarkup(<PrintPage course={coffeeCourse} />);
    expect(html).toContain('风味');
    expect(html).toContain('变量');
    expect(html).toContain('记录');
    expect(html).toContain('href="/course"');
    expect(html).toContain('再冲一杯');
  });

  it('waits for decoded images and reports failed sources', async () => {
    let release: () => void = () => undefined;
    const decoded = new Promise<void>((resolve) => { release = resolve; });
    const ready = {
      complete: true, naturalWidth: 100, currentSrc: 'https://img.example/ready.jpg', src: 'https://img.example/ready.jpg',
      decode: () => decoded
    } as HTMLImageElement;
    let settled = false;
    const waiting = waitForImages([ready]).then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    release();
    await waiting;
    expect(settled).toBe(true);

    const failed = {
      complete: true, naturalWidth: 0, currentSrc: 'https://img.example/missing.jpg', src: 'https://img.example/missing.jpg',
      decode: async () => undefined
    } as HTMLImageElement;
    await expect(waitForImages([failed])).rejects.toThrow('https://img.example/missing.jpg');
  });
});
import { readFileSync } from 'node:fs';
