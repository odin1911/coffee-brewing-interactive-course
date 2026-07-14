import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import altJson from '../fixtures/course-alt.json';
import courseJson from '../fixtures/course-coffee.json';
import { courseTheme, validateCourse } from '../src/course';
import { applyCourseTitle, ChartView, completeCourse, CoursePage, PrintPage, QuizView, SlideView, ToolsPage, waitForImages } from '../src/main';

const altCourse = validateCourse(altJson);
const coffeeCourse = validateCourse(courseJson);
const noop = () => undefined;

describe('JSON-driven presentation rendering', () => {
  it('records the final slide and completed status before following the CTA', async () => {
    const events: string[] = [];
    const recorder = {
      slideCompleted: async (slideId: string) => { events.push(`slide:${slideId}`); },
      finish: async (status: 'completed' | 'abandoned') => { events.push(`status:${status}`); }
    };

    await completeCourse(recorder, 'summary', '/course', (href) => { events.push(`navigate:${href}`); });

    expect(events).toEqual(['slide:summary', 'status:completed', 'navigate:/course']);
  });

  it('replaces the generic shell title with the JSON course title', () => {
    const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const target = { title: '交互式课件' };

    expect(shell).not.toContain('咖啡冲煮入门');
    applyCourseTitle(altCourse.course.title, target);
    expect(target.title).toBe(altCourse.course.title);
  });

  it('renders the alternate course without coffee-course copy or colors', () => {
    const cover = altCourse.slides[0];
    const courseHtml = renderToStaticMarkup(
      <SlideView course={altCourse} slide={cover} pageNumber="01" detailId={null} onVote={noop} onDetail={noop} onCloseDetail={noop} />
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

  it('renders every Appendix B tools label from JSON with the course theme', () => {
    const courseHtml = renderToStaticMarkup(<CoursePage course={altCourse} />);
    const toolsHtml = renderToStaticMarkup(<ToolsPage course={altCourse} />);

    expect(courseHtml).toContain(altCourse.ui.openTools);
    for (const key of ['openTools', 'recordStatus', 'restartCourse', 'validationResult', 'exportPdf', 'backToCourse'] as const) {
      expect(toolsHtml).toContain(altCourse.ui[key]);
    }
    expect(toolsHtml).toContain(altCourse.course.brand.primary);
    expect(toolsHtml).not.toMatch(/课外工具|课件工具页|咖啡|冲煮/);
  });

  it('uses JSON-backed theme variables for course and print surfaces', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
    const source = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
    expect(css).toMatch(/\.app-shell\{[^}]*background:var\(--primary\)/);
    expect(css).toMatch(/\.stage\{[^}]*background:var\(--canvas\)/);
    expect(css).toMatch(/\.bar\{[^}]*background:var\(--bar-color/);
    expect(css).toMatch(/\.print-slide\{[^}]*background:var\(--canvas\)/);
    expect(css).toMatch(/:where\(a,button\):focus-visible\{[^}]*outline:3px solid var\(--focus\)/);
    expect(css).toMatch(/\.course-label\{[^}]*color:var\(--canvas\)/);
    expect(css).toMatch(/\.course-header a:focus-visible[^}]*outline-color:var\(--canvas\)/);
    expect(courseTheme(altCourse.course.brand)['--focus']).toBe(altCourse.course.brand.text);
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

  it('renders only presenter-counted quiz votes and percentages', () => {
    const quiz = coffeeCourse.slides.find((slide) => slide.id === 'quiz');
    if (!quiz || quiz.type !== 'quiz') throw new Error('quiz missing');

    const counted = renderToStaticMarkup(
      <QuizView slide={quiz} ui={coffeeCourse.ui} pageNumber="05" votes={{ basic: 2, pro: 1 }} onVote={noop} />
    );
    const empty = renderToStaticMarkup(
      <QuizView slide={quiz} ui={coffeeCourse.ui} pageNumber="05" votes={{}} onVote={noop} />
    );

    expect(counted).toContain(`2 ${coffeeCourse.ui.peopleUnit}`);
    expect(counted).toContain('67%');
    expect(counted).toContain(coffeeCourse.ui.selected);
    expect(counted).toContain(`aria-label="−1 速溶 / 不常喝"`);
    expect(empty).toContain('0%');
    expect(empty).not.toContain('60%');
  });

  it('prints configured cover topics and CTA action', () => {
    const html = renderToStaticMarkup(<PrintPage course={coffeeCourse} />);
    expect(html).toContain('风味');
    expect(html).toContain('变量');
    expect(html).toContain('记录');
    expect(html).toContain('href="/course"');
    expect(html).toContain('再冲一杯');
  });

  it('reuses the course slide structure for every print main page', () => {
    const html = renderToStaticMarkup(<PrintPage course={coffeeCourse} />);

    expect(html.match(/data-slide-id=/g)).toHaveLength(coffeeCourse.slides.length);
    expect(html).toContain('class="cover-grid"');
    expect(html).not.toContain('class="print-brand"');
    expect(html).not.toContain(coffeeCourse.ui.results);
  });

  it('adds chart detail continuation pages after their main slides', () => {
    const html = renderToStaticMarkup(<PrintPage course={coffeeCourse} />);

    expect(html.match(/print-slide/g)).toHaveLength(11);
    expect(html.match(/chart-detail-page/g)).toHaveLength(2);
    expect(html).toContain('03A');
    expect(html).toContain('08A');
    for (const detail of Object.values(coffeeCourse.details)) {
      expect(html).toContain(detail.title);
      for (const fact of detail.facts) expect(html).toContain(fact);
    }
  });

  it('keeps shared slides at 16:9 and one slide per printed page', () => {
    const css = readFileSync(new URL('../src/print.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.print-slide[^}]*aspect-ratio:\s*16\s*\/\s*9/);
    expect(css).toMatch(/@media print[\s\S]*\.print-toolbar\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/@media print[\s\S]*\.print-slide[^}]*width:\s*100vw[^}]*height:\s*100vh/);
    expect(css).toMatch(/@media print[\s\S]*\.cover-grid\s*\{[^}]*grid-template-columns:\s*1\.02fr\s+\.98fr/);
    expect(css).toMatch(/@media print[\s\S]*\.hero-image\s*\{[^}]*max-height:\s*560px/);
    expect(css).toMatch(/@media print[\s\S]*\.chart-slide\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(260px,\s*360px\)/);
    expect(css).toMatch(/@media print[\s\S]*\.quiz-slide\s*\{[^}]*grid-template-columns:\s*minmax\(280px,\s*1fr\)\s+minmax\(380px,\s*1fr\)/);
  });

  it('uses the course canvas width for print preview and PDF content', () => {
    const css = readFileSync(new URL('../src/print.css', import.meta.url), 'utf8');

    expect(css).toMatch(/\.print-deck\s*\{[^}]*padding:\s*22px/);
    expect(css).toMatch(/\.print-deck \.print-slide\s*\{[^}]*width:\s*100%[^}]*max-width:\s*1440px/);
    expect(css).toMatch(/@media print[\s\S]*padding-left:\s*max\(62px,\s*calc\(\(100vw - 1440px\)\s*\/\s*2 \+ 62px\)\)/);
    expect(css).toMatch(/@media print[\s\S]*padding-right:\s*max\(76px,\s*calc\(\(100vw - 1440px\)\s*\/\s*2 \+ 76px\)\)/);
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
