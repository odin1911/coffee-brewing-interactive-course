# Coffee Course Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a JSON-driven React course engine with inline quiz branching, clickable chart details, complete-course PDF printing, and incremental local learning-session records.

**Architecture:** A Vite React SPA exposes `/course`, `/tools`, and `/print`. Runtime course content is fetched from `public/course.json`; pure TypeScript validates content and drives a reducer-based session. A small Express/Vite server writes one atomically updated JSON file per local learning session, while static deployments automatically disable recording.

**Tech Stack:** Node.js 24, React, TypeScript, Vite, React Router, Express, Vitest, native SVG, browser print CSS.

## Global Constraints

- The formal implementation timebox is 4 hours; design inputs are generated before the timebox.
- Local design skills produce only `DESIGN.md` and three reference pages; they are not runtime dependencies.
- All course text, UI labels, page order, image paths, brand colors, and chart data come from `public/course.json`.
- Runtime content and assets are local; the app makes no runtime AI or third-party content requests.
- `/course` contains only teaching content; `/tools` and `/print` are not teaching slides.
- A learner sees one eight-page branch path; `/print` renders all nine configured slide definitions and all chart details.
- Local recording creates a new JSON file per `/course` run and updates it after each completed segment or key event.
- Static deployment must keep teaching and PDF features working while disabling recording.
- Normal text contrast is at least 4.5:1; large text contrast is at least 3:1.
- No account system, database, cloud sync, multi-device polling, PPTX export, page-builder abstraction, state library, or chart library.

## Execution Budget

- Before exam: Task 0, 30–45 minutes.
- Exam minute 0–25: Task 1.
- Minute 25–50: Task 2.
- Minute 50–85: Task 3.
- Minute 85–125: Task 4.
- Minute 125–170: Task 5.
- Minute 170–200: Task 6.
- Minute 200–220: Task 7.
- Minute 220–240: Task 8 and final verification.

At each task boundary, stop visual polishing when its budget expires and preserve the functional acceptance criteria. Do not cut JSON replacement proof, incremental recording, route separation, or PDF inspection.

---

## Planned File Structure

```text
.
├── DESIGN.md                              # Approved warm-editorial design contract
├── README.md                              # Run, configure, validate, export, and record guide
├── index.html                             # Vite entry document
├── package.json                           # Scripts and dependencies
├── package-lock.json                      # Reproducible dependency lock
├── server.mjs                             # Express API + Vite/static host
├── server/
│   └── session-store.mjs                  # UUID validation and atomic JSON persistence
├── public/
│   ├── course.json                        # Active runtime course
│   ├── sources.json                       # Source and AI-generation audit trail
│   └── assets/
│       ├── coffee-hero.png                # AI-generated cover visual
│       ├── logo.png                       # AI-generated brand mark
│       ├── brewing-parameters.txt         # AI-generated local CTA handout
│       ├── disaster-logo.svg              # Alternate-course replacement asset
│       └── disaster-checklist.txt          # Alternate-course replacement handout
├── fixtures/
│   └── course-alt.json                    # Completely different replacement course
├── examples/
│   └── learning-record.json               # Reviewed record example
├── exports/
│   └── course.pdf                         # Inspected nine-page submission PDF
├── docs/
│   ├── design/
│   │   ├── reference-cover.html
│   │   ├── reference-chart.html
│   │   └── reference-quiz.html
│   └── skills/Contract.md                 # Living hard constraints
├── src/
│   ├── main.tsx                           # React root
│   ├── App.tsx                            # Loading, router, shared session ownership
│   ├── course.ts                          # Course types, loading, and validation
│   ├── session.ts                         # Reducer and navigation rules
│   ├── recorder.ts                        # Active-time tracker and incremental client API
│   ├── slides.tsx                         # Five slide renderers
│   ├── pages.tsx                          # Course, tools, and print route components
│   └── styles.css                         # Screen, accessibility, and print styles
├── tests/
│   ├── course.test.ts
│   ├── session.test.ts
│   ├── recorder.test.ts
│   ├── session-store.test.ts
│   └── course-alt.test.ts
├── tsconfig.json
└── vite.config.ts
```

---

### Task 0: Prepare Design Inputs Before the Four-Hour Timebox

**Files:**
- Create: `DESIGN.md`
- Create: `docs/design/reference-cover.html`
- Create: `docs/design/reference-chart.html`
- Create: `docs/design/reference-quiz.html`
- Create: `public/assets/coffee-hero.png`
- Create: `public/assets/logo.png`

**Interfaces:**
- Consumes: Approved visual direction from `docs/superpowers/specs/2026-07-14-coffee-course-engine-design.md`.
- Produces: Stable color, type, spacing, motion, and accessibility rules used by Task 3; two local raster assets referenced by `course.json`.

- [ ] **Step 1: Generate the design contract and three reference pages**

Use the local `reference-design-contract` skill for the contract and `frontend-design` for the HTML references. Keep the workflow file-only with no external service. Use this exact brief:

```text
Create DESIGN.md plus three standalone 16:9 HTML reference pages for a
Chinese interactive course named “咖啡冲煮入门”: cover, clickable bar chart,
and inline quiz results. Visual direction: warm editorial; cream #F7F0E5,
coffee brown #4A2C1A, amber #D89A4E, body text #2B211B. Use explicit text
colors on every light container. Normal-text contrast >= 4.5:1, large text
>= 3:1. Typography must work with system Chinese fonts. Keep layouts feasible
with plain React and CSS. No runtime library, remote font, dark
mode, glassmorphism, or dashboard chrome.
```

Save the outputs at the exact paths in this task. Reference pages are design evidence, not application code.

- [ ] **Step 2: Use imagegen for local visual assets**

Invoke the `imagegen` skill twice with these briefs:

```text
coffee-hero.png: 16:9 warm editorial still life of a ceramic pour-over brewer,
coffee beans, paper texture and soft morning light; cream, coffee brown and
amber palette; no words, no logo, no watermark, generous negative space left.

logo.png: minimal flat coffee-bean-and-water-drop mark, coffee brown and amber,
centered on transparent background, no letters, no watermark.
```

Save the outputs as `public/assets/coffee-hero.png` and `public/assets/logo.png`.

- [ ] **Step 3: Apply the deterministic minimum if generated output is incomplete**

Use this verified minimum to complete `DESIGN.md` instead of spending the exam window on design iteration:

```markdown
# Warm Editorial Course Design

- Canvas: `#F7F0E5`; primary text: `#2B211B`.
- Heading/action: `#4A2C1A`; accent only: `#D89A4E`.
- Chinese font stack: `"PingFang SC", "Microsoft YaHei", system-ui, sans-serif`.
- 16:9 stage; 64px desktop padding; 32px compact padding.
- H1 64/1.08, H2 42/1.15, body 24/1.55, label 16/1.4.
- Cards: 16px radius, 24px padding, 1px `#D8C7B5` border, no glass effect.
- Every light container sets `color: #2B211B`; never inherit dark-mode text.
- Normal text contrast >= 4.5:1; large text contrast >= 3:1.
- Focus ring: 3px `#D89A4E` plus 2px cream offset.
- Motion: opacity/translate only, <= 220ms; disable under reduced motion.
- Print: preserve cream background, remove shadows, one slide per 16:9 page.
- Avoid remote fonts, tiny captions, decorative gradients, and color-only meaning.
```

Also create the three required fallback references so the design evidence remains complete:

`docs/design/reference-cover.html`:

```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>封面参考</title><style>*{box-sizing:border-box}body{margin:0;background:#1E1814;display:grid;place-items:center;min-height:100vh;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}.stage{width:min(96vw,160vh);aspect-ratio:16/9;background:#F7F0E5;color:#2B211B;padding:64px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:48px;border-radius:18px}.eyebrow{color:#7B4B2D;font-size:18px;font-weight:700;letter-spacing:.14em}h1{color:#4A2C1A;font-size:72px;line-height:1.08;margin:18px 0}p{font-size:26px;line-height:1.55}.art{height:72%;border-radius:22px;background:#D89A4E;display:grid;place-items:center;color:#2B211B;font-size:42px;font-weight:800}</style><main class="stage"><section><div class="eyebrow">咖啡冲煮入门</div><h1>从风味到一杯稳定的手冲</h1><p>理解变量，记录感受，每次只改变一件事。</p></section><div class="art" aria-label="咖啡主视觉位置">COFFEE</div></main></html>
```

`docs/design/reference-chart.html`:

```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>图表参考</title><style>*{box-sizing:border-box}body{margin:0;background:#1E1814;display:grid;place-items:center;min-height:100vh;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}.stage{position:relative;width:min(96vw,160vh);aspect-ratio:16/9;background:#F7F0E5;color:#2B211B;padding:56px;border-radius:18px}h1{color:#4A2C1A;font-size:48px;margin:0}.bars{height:58%;display:flex;align-items:end;gap:40px;margin-top:50px}.bar{width:120px;background:#D89A4E;border:0;border-radius:12px 12px 0 0;color:#2B211B;font:700 20px inherit;position:relative}.bar span{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:12px;white-space:nowrap}.detail{position:absolute;right:0;top:0;width:36%;height:100%;padding:48px;background:#FFF9F0;color:#2B211B;border-left:2px solid #D8C7B5}h2{color:#4A2C1A;font-size:34px}.detail p{font-size:22px;line-height:1.55}</style><main class="stage"><h1>常见饮品咖啡因含量</h1><div class="bars"><button class="bar" style="height:32%">63<span>意式浓缩</span></button><button class="bar" style="height:72%">145<span>手冲</span></button><button class="bar" style="height:100%">200<span>冷萃</span></button></div><aside class="detail"><h2>手冲 · 145 mg</h2><p>点击柱形后显示容量、萃取方式和解释；面板始终使用明确深色文字。</p></aside></main></html>
```

`docs/design/reference-quiz.html`:

```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>答题参考</title><style>*{box-sizing:border-box}body{margin:0;background:#1E1814;display:grid;place-items:center;min-height:100vh;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}.stage{width:min(96vw,160vh);aspect-ratio:16/9;background:#F7F0E5;color:#2B211B;padding:64px;border-radius:18px}h1{color:#4A2C1A;font-size:50px;margin:0 0 34px}.option{display:block;width:58%;margin:14px 0;padding:18px 22px;text-align:left;border:2px solid #4A2C1A;border-radius:14px;background:#FFF9F0;color:#2B211B;font-size:23px}.selected{background:#4A2C1A;color:#fff}.result{display:grid;grid-template-columns:170px 1fr 54px;align-items:center;gap:16px;width:72%;font-size:21px;margin-top:22px}.track{height:18px;background:#E6D7C7;border-radius:99px}.fill{height:100%;background:#D89A4E;border-radius:99px}</style><main class="stage"><h1>你平时怎么喝咖啡？</h1><button class="option selected">速溶 / 不常喝</button><button class="option">手冲 / 意式</button><div class="result"><span>速溶 / 不常喝</span><div class="track"><div class="fill" style="width:62%"></div></div><strong>62%</strong></div><div class="result"><span>手冲 / 意式</span><div class="track"><div class="fill" style="width:38%"></div></div><strong>38%</strong></div></main></html>
```

- [ ] **Step 4: Verify and commit design inputs**

Run:

```bash
test -s DESIGN.md
test -s docs/design/reference-cover.html
test -s docs/design/reference-chart.html
test -s docs/design/reference-quiz.html
test -s public/assets/coffee-hero.png
test -s public/assets/logo.png
rg -n "4.5:1|#F7F0E5|#4A2C1A|#D89A4E" DESIGN.md
```

Expected: all `test` commands exit 0 and `rg` prints the contrast rule and all three colors.

```bash
git add DESIGN.md docs/design public/assets
git commit -m "docs: add course design system"
```

---

### Task 1: Scaffold the Runtime and Validate External Course JSON

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/course.ts`
- Create: `tests/course.test.ts`
- Modify: `.gitignore`
- Modify: `docs/skills/Contract.md`

**Interfaces:**
- Consumes: None beyond Node.js 24.
- Produces: `CourseConfig`, `Slide`, `CourseConfigError`, `validateCourse(input)`, and `loadCourse(url)` for every later task.

- [ ] **Step 1: Create package and compiler configuration**

Create `package.json`:

```json
{
  "name": "coffee-brewing-interactive-course",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "start": "npm run build && node server.mjs",
    "local": "npm start",
    "test": "vitest run"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>交互式课件</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Install current compatible packages and commit `package-lock.json`:

```bash
npm install react react-dom react-router-dom express
npm install --save-dev typescript vite @vitejs/plugin-react vitest @types/react @types/react-dom @types/express
```

Expected: both commands exit 0 and `node -p "require('./package-lock.json').lockfileVersion"` prints a number.

- [ ] **Step 2: Write the failing course-validation tests**

Create `tests/course.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CourseConfigError, validateCourse } from '../src/course';

const valid: any = {
  course: {
    id: 'demo', version: '1', title: 'Demo', presenter: 'P',
    brand: { primary: '#4A2C1A', accent: '#D89A4E', background: '#F7F0E5', text: '#2B211B', logo: 'assets/logo.png' }
  },
  ui: {
    navigation: 'Course navigation', previous: 'Prev', next: 'Next', continue: 'Continue', showDetail: 'Show',
    closeDetail: 'Close', exportPdf: 'PDF', openTools: 'Tools',
    recordStatus: 'Record', restartCourse: 'Restart', validationResult: 'Validation'
  },
  slides: [
    { id: 'cover', type: 'cover', title: 'Demo' },
    { id: 'quiz', type: 'quiz', question: 'Pick', options: [{ id: 'a', text: 'A', goto: 'end' }, { id: 'b', text: 'B', goto: 'end' }] },
    { id: 'end', type: 'cta', title: 'End', body: 'Done', action: { label: 'Go', href: '#' } }
  ],
  details: {}
};

describe('validateCourse', () => {
  it('accepts a valid course', () => expect(validateCourse(valid).course.id).toBe('demo'));

  it('rejects duplicate slide ids', () => {
    const input = structuredClone(valid);
    input.slides[2].id = 'quiz';
    expect(() => validateCourse(input)).toThrow(/duplicate slide id: quiz/);
  });

  it('rejects missing branch targets', () => {
    const input = structuredClone(valid);
    input.slides[1].options[0].goto = 'missing';
    expect(() => validateCourse(input)).toThrow(/unknown goto: missing/);
  });

  it('rejects missing chart details', () => {
    const input = structuredClone(valid);
    input.slides.splice(1, 0, {
      id: 'chart', type: 'chart', title: 'Chart',
      chart: { kind: 'bar', unit: 'mg', clickable: true, series: [{ label: 'A', value: 1, detail: 'missing' }] }
    });
    expect(() => validateCourse(input)).toThrow(/unknown detail: missing/);
  });

  it('returns every validation error', () => {
    expect(() => validateCourse({ slides: [] })).toThrow(CourseConfigError);
    try { validateCourse({ slides: [] }); } catch (error) {
      expect((error as CourseConfigError).errors.length).toBeGreaterThan(1);
    }
  });
});
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```bash
npm test -- tests/course.test.ts
```

Expected: FAIL because `../src/course` does not exist.

- [ ] **Step 4: Implement complete course types, validation, and loading**

Create `src/course.ts`:

```ts
export type Brand = { primary: string; accent: string; background: string; text: string; logo: string };
export type UiCopy = {
  navigation: string; previous: string; next: string; continue: string; showDetail: string; closeDetail: string;
  exportPdf: string; openTools: string; recordStatus: string; restartCourse: string; validationResult: string;
};
type BaseSlide = { id: string; type: string; title?: string; next?: string };
export type CoverSlide = BaseSlide & { type: 'cover'; title: string; subtitle?: string; image?: string; imageAlt?: string };
export type ContentSlide = BaseSlide & { type: 'content'; title: string; bullets: string[]; image?: string; imageAlt?: string };
export type ChartSlide = BaseSlide & {
  type: 'chart'; title: string;
  chart: { kind: 'bar'; unit: string; clickable: boolean; series: Array<{ label: string; value: number; detail: string }> };
};
export type QuizSlide = BaseSlide & {
  type: 'quiz'; question: string;
  options: Array<{ id: string; text: string; goto: string; initialVotes?: number }>;
};
export type CtaSlide = BaseSlide & { type: 'cta'; title: string; body: string; action: { label: string; href: string } };
export type Slide = CoverSlide | ContentSlide | ChartSlide | QuizSlide | CtaSlide;
export type Detail = { title: string; facts: string[] };
export type CourseConfig = {
  course: { id: string; version: string; title: string; presenter: string; brand: Brand };
  ui: UiCopy;
  slides: Slide[];
  details: Record<string, Detail>;
};

export class CourseConfigError extends Error {
  constructor(public errors: string[]) {
    super(errors.join('\n'));
    this.name = 'CourseConfigError';
  }
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function validateCourse(input: unknown): CourseConfig {
  const errors: string[] = [];
  if (!record(input)) throw new CourseConfigError(['root must be an object']);
  const course = input.course;
  const ui = input.ui;
  const slides = input.slides;
  const details = input.details;

  if (!record(course)) errors.push('course must be an object');
  else {
    for (const key of ['id', 'version', 'title', 'presenter']) if (!text(course[key])) errors.push(`course.${key} must be text`);
    if (!record(course.brand)) errors.push('course.brand must be an object');
    else for (const key of ['primary', 'accent', 'background', 'text', 'logo']) if (!text(course.brand[key])) errors.push(`course.brand.${key} must be text`);
  }

  const uiKeys = ['navigation', 'previous', 'next', 'continue', 'showDetail', 'closeDetail', 'exportPdf', 'openTools', 'recordStatus', 'restartCourse', 'validationResult'];
  if (!record(ui)) errors.push('ui must be an object');
  else for (const key of uiKeys) if (!text(ui[key])) errors.push(`ui.${key} must be text`);

  if (!record(details)) errors.push('details must be an object');
  else for (const [id, value] of Object.entries(details)) {
    if (!record(value) || !text(value.title) || !Array.isArray(value.facts) || !value.facts.every(text)) errors.push(`details.${id} is invalid`);
  }

  if (!Array.isArray(slides) || slides.length === 0) errors.push('slides must be a non-empty array');
  else {
    const ids = new Set<string>();
    for (const [index, raw] of slides.entries()) {
      if (!record(raw) || !text(raw.id) || !text(raw.type)) { errors.push(`slides.${index} requires id and type`); continue; }
      if (ids.has(raw.id)) errors.push(`duplicate slide id: ${raw.id}`);
      ids.add(raw.id);
      if (raw.next !== undefined && !text(raw.next)) errors.push(`slides.${index}.next must be text`);
      if (raw.type === 'cover' && !text(raw.title)) errors.push(`slides.${index}.title must be text`);
      else if (raw.type === 'content' && (!text(raw.title) || !Array.isArray(raw.bullets) || !raw.bullets.every(text))) errors.push(`slides.${index} content is invalid`);
      else if (raw.type === 'chart') {
        if (!text(raw.title) || !record(raw.chart) || raw.chart.kind !== 'bar' || !text(raw.chart.unit) || !Array.isArray(raw.chart.series)) errors.push(`slides.${index} chart is invalid`);
        else for (const item of raw.chart.series) if (!record(item) || !text(item.label) || typeof item.value !== 'number' || !text(item.detail)) errors.push(`slides.${index} chart item is invalid`);
      } else if (raw.type === 'quiz') {
        if (!text(raw.question) || !Array.isArray(raw.options) || raw.options.length < 2) errors.push(`slides.${index} quiz is invalid`);
        else for (const option of raw.options) if (!record(option) || !text(option.id) || !text(option.text) || !text(option.goto)) errors.push(`slides.${index} quiz option is invalid`);
      } else if (raw.type === 'cta' && (!text(raw.title) || !text(raw.body) || !record(raw.action) || !text(raw.action.label) || !text(raw.action.href))) errors.push(`slides.${index} cta is invalid`);
      else if (!['cover', 'content', 'chart', 'quiz', 'cta'].includes(raw.type)) errors.push(`slides.${index} unknown type: ${raw.type}`);
    }
    for (const raw of slides) if (record(raw)) {
      if (text(raw.next) && !ids.has(raw.next)) errors.push(`unknown next: ${raw.next}`);
      if (raw.type === 'quiz' && Array.isArray(raw.options)) for (const option of raw.options) if (record(option) && text(option.goto) && !ids.has(option.goto)) errors.push(`unknown goto: ${option.goto}`);
      if (raw.type === 'chart' && record(raw.chart) && Array.isArray(raw.chart.series)) for (const item of raw.chart.series) if (record(item) && text(item.detail) && (!record(details) || !(item.detail in details))) errors.push(`unknown detail: ${item.detail}`);
    }
  }

  if (errors.length) throw new CourseConfigError(errors);
  return input as CourseConfig;
}

export async function loadCourse(url = '/course.json'): Promise<CourseConfig> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new CourseConfigError([`failed to load ${url}: ${response.status}`]);
  return validateCourse(await response.json());
}
```

- [ ] **Step 5: Verify GREEN and record hard constraints**

Run:

```bash
npm test -- tests/course.test.ts
```

Expected: 5 tests PASS.

Replace the empty `docs/skills/Contract.md` with:

```markdown
# Contract

- Runtime course content is loaded from `public/course.json`; replacing it must not require code changes.
- Course slides contain teaching only. Export, recording status, restart, and validation live under `/tools`.
- `/print` renders all configured branches and chart details; `/tools` never appears in the PDF.
- Local recording writes one server-generated JSON file per course run; static deployment disables recording.
- No runtime AI request, remote font, remote non-image content, state library, or chart library; configured HTTPS images are allowed.
- Light surfaces set explicit dark foreground colors. Normal text contrast is at least 4.5:1.
```

Append to `.gitignore`:

```gitignore
records/*.json
records/*.tmp
```

- [ ] **Step 6: Commit the validated contract layer**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/course.ts tests/course.test.ts docs/skills/Contract.md .gitignore
git commit -m "feat: validate external course configuration"
```

---

### Task 2: Implement Reducer-Based Branch Navigation

**Files:**
- Create: `src/session.ts`
- Create: `tests/session.test.ts`

**Interfaces:**
- Consumes: `CourseConfig`, `QuizSlide`, and `Slide` from `src/course.ts`.
- Produces: `SessionState`, `SessionAction`, `createInitialState(course)`, `createCourseReducer(course)`, and `getNextSlideId(course, state)`.

- [ ] **Step 1: Write the failing reducer tests**

Create `tests/session.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { CourseConfig } from '../src/course';
import { createCourseReducer, createInitialState } from '../src/session';

const course = {
  course: { id: 'x', version: '1', title: 'X', presenter: 'P', brand: { primary: '#1', accent: '#2', background: '#3', text: '#4', logo: 'x' } },
  ui: { previous: 'p', next: 'n', continue: 'c', showDetail: 's', closeDetail: 'x', exportPdf: 'e', openTools: 't', recordStatus: 'r', restartCourse: 'z', validationResult: 'v' },
  details: {},
  slides: [
    { id: 'cover', type: 'cover', title: 'Cover' },
    { id: 'quiz', type: 'quiz', question: 'Q', options: [{ id: 'a', text: 'A', goto: 'basic', initialVotes: 2 }, { id: 'b', text: 'B', goto: 'pro', initialVotes: 1 }] },
    { id: 'basic', type: 'content', title: 'Basic', bullets: [], next: 'end' },
    { id: 'pro', type: 'content', title: 'Pro', bullets: [], next: 'end' },
    { id: 'end', type: 'cta', title: 'End', body: 'Done', action: { label: 'Go', href: '#' } }
  ]
} satisfies CourseConfig;

describe('course reducer', () => {
  const reduce = createCourseReducer(course);

  it('follows array order for ordinary slides', () => {
    expect(reduce(createInitialState(course), { type: 'NEXT' }).currentId).toBe('quiz');
  });

  it('blocks quiz continuation until an answer exists', () => {
    const atQuiz = reduce(createInitialState(course), { type: 'NEXT' });
    expect(reduce(atQuiz, { type: 'NEXT' })).toEqual(atQuiz);
  });

  it('branches through the selected goto and explicit merge', () => {
    let state = reduce(createInitialState(course), { type: 'NEXT' });
    state = reduce(state, { type: 'ANSWER', slideId: 'quiz', optionId: 'a' });
    state = reduce(state, { type: 'NEXT' });
    expect(state.currentId).toBe('basic');
    expect(reduce(state, { type: 'NEXT' }).currentId).toBe('end');
  });

  it('backs through visitedPath and permits a different branch', () => {
    let state = reduce(createInitialState(course), { type: 'NEXT' });
    state = reduce(state, { type: 'ANSWER', slideId: 'quiz', optionId: 'a' });
    state = reduce(state, { type: 'NEXT' });
    state = reduce(state, { type: 'PREVIOUS' });
    state = reduce(state, { type: 'ANSWER', slideId: 'quiz', optionId: 'b' });
    state = reduce(state, { type: 'NEXT' });
    expect(state.currentId).toBe('pro');
    expect(state.visitedPath).toEqual(['cover', 'quiz', 'pro']);
  });

  it('opens and closes one chart detail', () => {
    let state = reduce(createInitialState(course), { type: 'OPEN_DETAIL', detailId: 'd1' });
    expect(state.selectedDetail).toBe('d1');
    state = reduce(state, { type: 'CLOSE_DETAIL' });
    expect(state.selectedDetail).toBeNull();
  });
});
```

- [ ] **Step 2: Run the reducer test and verify RED**

Run `npm test -- tests/session.test.ts`.

Expected: FAIL because `src/session.ts` does not exist.

- [ ] **Step 3: Implement the minimal reducer**

Create `src/session.ts`:

```ts
import type { CourseConfig, QuizSlide } from './course';

export type SessionState = {
  currentId: string;
  visitedPath: string[];
  answers: Record<string, string>;
  selectedDetail: string | null;
};

export type SessionAction =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'ANSWER'; slideId: string; optionId: string }
  | { type: 'OPEN_DETAIL'; detailId: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'RESET' };

export function createInitialState(course: CourseConfig): SessionState {
  return { currentId: course.slides[0].id, visitedPath: [course.slides[0].id], answers: {}, selectedDetail: null };
}

export function getNextSlideId(course: CourseConfig, state: SessionState): string | null {
  const index = course.slides.findIndex((slide) => slide.id === state.currentId);
  const slide = course.slides[index];
  if (!slide) return null;
  if (slide.type === 'quiz') {
    const optionId = state.answers[slide.id];
    return optionId ? (slide as QuizSlide).options.find((option) => option.id === optionId)?.goto ?? null : null;
  }
  return slide.next ?? course.slides[index + 1]?.id ?? null;
}

export function createCourseReducer(course: CourseConfig) {
  return (state: SessionState, action: SessionAction): SessionState => {
    if (action.type === 'RESET') return createInitialState(course);
    if (action.type === 'ANSWER') return { ...state, answers: { ...state.answers, [action.slideId]: action.optionId } };
    if (action.type === 'OPEN_DETAIL') return { ...state, selectedDetail: action.detailId };
    if (action.type === 'CLOSE_DETAIL') return { ...state, selectedDetail: null };
    if (action.type === 'PREVIOUS') {
      if (state.visitedPath.length === 1) return state;
      const visitedPath = state.visitedPath.slice(0, -1);
      return { ...state, currentId: visitedPath.at(-1)!, visitedPath, selectedDetail: null };
    }
    const next = getNextSlideId(course, state);
    return next ? { ...state, currentId: next, visitedPath: [...state.visitedPath, next], selectedDetail: null } : state;
  };
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run `npm test -- tests/session.test.ts`.

Expected: 5 tests PASS.

```bash
git add src/session.ts tests/session.test.ts
git commit -m "feat: add branching course navigation"
```

---

### Task 3: Render the Core Course Routes and Static Slide Types

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/pages.tsx`
- Create: `src/slides.tsx`
- Create: `src/styles.css`
- Create: `public/course.json`
- Create: `public/sources.json`
- Create: `public/assets/brewing-parameters.txt`

**Interfaces:**
- Consumes: course loading from Task 1 and reducer from Task 2.
- Produces: `/course`, `CoursePage`, `SlideRenderer`, and reusable props `{ course, slide, state, dispatch, print }` for Tasks 4 and 6.

- [ ] **Step 1: Create the React root and shared course owner**

Create `src/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter><App /></BrowserRouter>
);
```

Create `src/App.tsx`:

```tsx
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CourseConfigError, loadCourse, type CourseConfig } from './course';
import { createCourseReducer, createInitialState } from './session';
import { CoursePage } from './pages';

export function App() {
  const [course, setCourse] = useState<CourseConfig | null>(null);
  const [error, setError] = useState<string[]>([]);
  useEffect(() => { loadCourse().then(setCourse).catch((value) => setError(value instanceof CourseConfigError ? value.errors : [String(value)])); }, []);
  if (error.length) return <main className="config-error"><h1>课程配置错误</h1><ul>{error.map((item) => <li key={item}>{item}</li>)}</ul></main>;
  if (!course) return <main className="loading">正在加载课程…</main>;
  return <LoadedApp course={course} />;
}

function LoadedApp({ course }: { course: CourseConfig }) {
  const reducer = useMemo(() => createCourseReducer(course), [course]);
  const [state, dispatch] = useReducer(reducer, course, createInitialState);
  useEffect(() => { document.title = course.course.title; }, [course.course.title]);
  const theme = { '--primary': course.course.brand.primary, '--accent': course.course.brand.accent, '--canvas': course.course.brand.background, '--ink': course.course.brand.text } as React.CSSProperties;
  return <div className="app-theme" style={theme}><Routes><Route path="/course" element={<CoursePage course={course} state={state} dispatch={dispatch} />} /><Route path="*" element={<Navigate to="/course" replace />} /></Routes></div>;
}
```

- [ ] **Step 2: Implement a working course page and all five read-only renderers**

Create `src/pages.tsx`:

```tsx
import { useEffect } from 'react';
import type { CourseConfig } from './course';
import { getNextSlideId, type SessionAction, type SessionState } from './session';
import { SlideRenderer } from './slides';

export type PageProps = { course: CourseConfig; state: SessionState; dispatch: React.Dispatch<SessionAction> };

export function CoursePage({ course, state, dispatch }: PageProps) {
  const slide = course.slides.find((item) => item.id === state.currentId)!;
  const canContinue = getNextSlideId(course, state) !== null;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.key === 'ArrowRight' || event.key === ' ') && canContinue) dispatch({ type: 'NEXT' });
      if (event.key === 'ArrowLeft') dispatch({ type: 'PREVIOUS' });
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [canContinue, dispatch]);
  return <main className="course-shell">
    <section className="stage"><SlideRenderer course={course} slide={slide} state={state} dispatch={dispatch} print={false} /></section>
    <nav className="course-nav" aria-label={course.ui.navigation}>
      <button onClick={() => dispatch({ type: 'PREVIOUS' })} disabled={state.visitedPath.length === 1}>{course.ui.previous}</button>
      <span>{state.visitedPath.length}</span>
      <button onClick={() => dispatch({ type: 'NEXT' })} disabled={!canContinue}>{course.ui.next}</button>
    </nav>
  </main>;
}
```

Create `src/slides.tsx`:

```tsx
import type { CourseConfig, Slide } from './course';
import type { SessionAction, SessionState } from './session';

type Props = { course: CourseConfig; slide: Slide; state: SessionState; dispatch: React.Dispatch<SessionAction>; print: boolean };

export function SlideRenderer(props: Props) {
  const { slide } = props;
  if (slide.type === 'cover') return <article className="slide cover"><div>{props.course.course.brand.logo && <img className="brand-logo" src={props.course.course.brand.logo} alt="" />}<p className="eyebrow">{props.course.course.presenter}</p><h1>{slide.title}</h1>{slide.subtitle && <p>{slide.subtitle}</p>}</div>{slide.image && <img src={slide.image} alt={slide.imageAlt ?? ''} />}</article>;
  if (slide.type === 'content') return <article className="slide content"><h2>{slide.title}</h2><ul>{slide.bullets.map((item) => <li key={item}>{item}</li>)}</ul>{slide.image && <img src={slide.image} alt={slide.imageAlt ?? ''} />}</article>;
  if (slide.type === 'cta') return <article className="slide cta"><h2>{slide.title}</h2><p>{slide.body}</p><a className="primary-action" href={slide.action.href}>{slide.action.label}</a></article>;
  if (slide.type === 'chart') return <article className="slide"><h2>{slide.title}</h2><div className="bars">{slide.chart.series.map((item) => <div className="bar-readonly" key={item.label} style={{ height: `${item.value / Math.max(...slide.chart.series.map((entry) => entry.value)) * 100}%` }}><span>{item.label}</span></div>)}</div></article>;
  return <article className="slide"><h2>{slide.question}</h2><div className="quiz-options">{slide.options.map((option) => <button key={option.id}>{option.text}</button>)}</div></article>;
}
```

- [ ] **Step 3: Apply the approved visual contract**

Create `src/styles.css`:

```css
:root{font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:#2B211B;background:#F7F0E5}*{box-sizing:border-box}body{margin:0}button,a{font:inherit}.course-shell{min-height:100vh;background:var(--canvas);color:var(--ink);display:grid;place-items:center;padding:24px}.stage{width:min(96vw,160vh);aspect-ratio:16/9;background:var(--canvas);border:1px solid #D8C7B5;border-radius:18px;overflow:hidden;box-shadow:0 20px 55px #4A2C1A22}.slide{position:relative;height:100%;padding:clamp(32px,5vw,72px);color:var(--ink);display:grid;align-content:center;gap:24px}.slide h1{font-size:clamp(48px,6vw,84px);line-height:1.08;margin:0;color:var(--primary)}.slide h2{font-size:clamp(36px,4vw,58px);line-height:1.15;margin:0;color:var(--primary)}.slide p,.slide li{font-size:clamp(20px,2vw,28px);line-height:1.55}.cover{grid-template-columns:1fr 1fr;align-items:center}.brand-logo{width:64px;height:64px;object-fit:contain;margin-bottom:18px}.cover>img,.content img{max-width:100%;max-height:70vh;object-fit:cover;border-radius:16px}.eyebrow{color:#7B4B2D;font-weight:700;letter-spacing:.12em}.content ul{display:grid;gap:18px}.primary-action,.course-nav button{background:var(--primary);color:#fff;border:0;border-radius:12px;padding:14px 22px;text-decoration:none}.course-nav{display:flex;gap:18px;align-items:center;margin-top:16px}.course-nav button:focus-visible,.quiz-options button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.bars{height:45vh;display:flex;align-items:end;gap:28px}.bar-readonly{min-width:70px;background:var(--accent);position:relative}.bar-readonly span{position:absolute;top:100%;margin-top:10px}.quiz-options{display:grid;grid-template-columns:1fr 1fr;gap:18px}.quiz-options button{padding:22px;border:2px solid #B79A7A;border-radius:14px;background:#FFF9F0;color:#2B211B}.config-error,.loading{padding:40px;max-width:900px;margin:auto}.config-error{color:#6C231E}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}@media(max-width:800px){.cover{grid-template-columns:1fr}.stage{aspect-ratio:auto;min-height:80vh}.quiz-options{grid-template-columns:1fr}}
```

- [ ] **Step 4: Create a minimal valid runtime course and source audit**

Create `public/course.json`:

```json
{
  "course": { "id": "coffee-brewing-intro", "version": "1.0.0", "title": "咖啡冲煮入门", "presenter": "AI 课程助教", "brand": { "primary": "#4A2C1A", "accent": "#D89A4E", "background": "#F7F0E5", "text": "#2B211B", "logo": "assets/logo.png" } },
  "ui": { "navigation": "课件导航", "previous": "上一页", "next": "下一页", "continue": "继续", "showDetail": "查看明细", "closeDetail": "关闭明细", "exportPdf": "导出完整 PDF", "openTools": "扩展工具", "recordStatus": "学习记录状态", "restartCourse": "重新开始课程", "validationResult": "配置校验结果" },
  "slides": [
    { "id": "cover", "type": "cover", "title": "咖啡冲煮入门", "subtitle": "从风味、变量到一杯稳定的手冲", "image": "assets/coffee-hero.png", "imageAlt": "陶瓷手冲滤杯、咖啡豆与晨光" },
    { "id": "beans", "type": "content", "title": "三大产区与风味", "bullets": ["非洲：明亮花果酸香", "中南美：坚果与巧克力调", "亚洲：醇厚、香料感与较低酸度", "烘焙度会改变这些风味的表达"] },
    { "id": "end", "type": "cta", "title": "先理解变量，再调整配方", "body": "选择一种冲煮方法，记录一次粉水比、时间和风味。", "action": { "label": "查看冲煮参数手册", "href": "assets/brewing-parameters.txt" } }
  ],
  "details": {}
}
```

Create `public/sources.json`:

```json
{
  "generatedAt": "2026-07-14",
  "items": [
    { "id": "course-copy-v1", "type": "ai-generated", "tool": "OpenAI Codex", "promptSummary": "Generate concise beginner coffee-course copy from the supplied exam outline", "purpose": "course text" },
    { "id": "exam-data", "type": "provided-document", "title": "PPK AI编程实战考核 考题", "purpose": "required slide outline and sample chart values" },
    { "id": "brewing-handout", "type": "ai-generated", "tool": "OpenAI Codex", "promptSummary": "Generate a concise beginner brewing parameter handout", "purpose": "local CTA handout" },
    { "id": "coffee-hero", "type": "ai-generated", "tool": "OpenAI imagegen", "promptSummary": "Warm editorial pour-over still life", "purpose": "cover image" },
    { "id": "logo", "type": "ai-generated", "tool": "OpenAI imagegen", "promptSummary": "Coffee bean and water drop mark", "purpose": "brand logo" }
  ]
}
```

Create `public/assets/brewing-parameters.txt`:

```text
咖啡冲煮参数手册

入门基准：咖啡豆 15 g，水 240 g，水温 90–94°C，总时间 2:30–3:15。
记录字段：豆子、研磨度、水温、粉水比、总时间、风味感受。
调整原则：每次只改变一个变量；偏酸可磨细或延长时间，偏苦涩可磨粗或降低水温。
以上为练习起点，请根据豆子、器具和个人口味调整。
```

- [ ] **Step 5: Run the app, verify the three-slide course, and commit**

Run `npm run dev`.

Expected: `/course` renders cover, content, and CTA; arrow keys and buttons navigate; every light surface uses dark text; browser console has no error.

Run `npm run build`.

Expected: exit 0 and `dist/index.html` exists.

```bash
git add src public/course.json public/sources.json
git commit -m "feat: render JSON-driven course slides"
```

---

### Task 4: Add Full Coffee Content, Quiz Branching, and Chart Drill-Down

**Files:**
- Modify: `public/course.json`
- Modify: `src/slides.tsx`
- Modify: `src/pages.tsx`
- Test: `tests/session.test.ts`

**Interfaces:**
- Consumes: `SessionAction` and complete course types.
- Produces: Accessible clickable bar charts, quiz statistics, explicit continue behavior, and both branch paths.

- [ ] **Step 1: Add failing tests for displayed quiz totals**

First add `quizResults` to the existing import from `../src/session` at the top of `tests/session.test.ts`, then append this test:

```ts
it('adds one current vote without mutating configured initial votes', () => {
  const quiz = course.slides[1];
  if (quiz.type !== 'quiz') throw new Error('fixture quiz missing');
  expect(quizResults(quiz, 'b')).toEqual([
    { id: 'a', text: 'A', votes: 2 },
    { id: 'b', text: 'B', votes: 2 }
  ]);
});
```

Run `npm test -- tests/session.test.ts`.

Expected: FAIL because `quizResults` is not exported.

- [ ] **Step 2: Implement the pure statistics helper**

Add to `src/session.ts`:

```ts
export function quizResults(slide: QuizSlide, selectedId?: string) {
  return slide.options.map((option) => ({
    id: option.id,
    text: option.text,
    votes: (option.initialVotes ?? 0) + (option.id === selectedId ? 1 : 0)
  }));
}
```

Run `npm test -- tests/session.test.ts`.

Expected: 6 tests PASS.

- [ ] **Step 3: Replace read-only chart and quiz rendering with real interactions**

Replace the chart and quiz branches in `SlideRenderer` inside `src/slides.tsx` with:

```tsx
if (slide.type === 'chart') {
  const max = Math.max(...slide.chart.series.map((item) => item.value));
  return <article className="slide chart"><h2>{slide.title}</h2><div className="bars">{slide.chart.series.map((item) =>
    <button className="bar-button" key={item.label} onClick={() => !props.print && props.dispatch({ type: 'OPEN_DETAIL', detailId: item.detail })} style={{ height: `${item.value / max * 100}%` }} aria-label={`${props.course.ui.showDetail}: ${item.label} ${item.value}${slide.chart.unit}`}>
      <span>{item.value}</span><strong>{item.label}</strong>
    </button>
  )}</div>{(props.print || props.state.selectedDetail) && <aside className="detail-panel">{(props.print ? slide.chart.series.map((item) => item.detail) : [props.state.selectedDetail!]).map((id) => <section key={id}><h3>{props.course.details[id].title}</h3><ul>{props.course.details[id].facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>)}{!props.print && <button onClick={() => props.dispatch({ type: 'CLOSE_DETAIL' })}>{props.course.ui.closeDetail}</button>}</aside>}</article>;
}
const selected = props.state.answers[slide.id];
const results = quizResults(slide, selected);
const total = results.reduce((sum, item) => sum + item.votes, 0);
return <article className="slide quiz"><h2>{slide.question}</h2><div className="quiz-options">{slide.options.map((option) => <button aria-pressed={selected === option.id} key={option.id} onClick={() => !props.print && props.dispatch({ type: 'ANSWER', slideId: slide.id, optionId: option.id })}>{option.text}</button>)}</div>{(selected || props.print) && <div className="quiz-results">{results.map((item) => <div key={item.id}><span>{item.text}</span><progress aria-label={`${item.text}: ${item.votes}`} max={total || 1} value={item.votes} /><strong>{item.votes}</strong></div>)}</div>}</article>;
```

Also change the import at the top of `src/slides.tsx` to:

```ts
import { quizResults, type SessionAction, type SessionState } from './session';
```

In `src/pages.tsx`, change the right navigation button label to show `course.ui.continue` on a quiz with an answer, and disable it on an unanswered quiz:

```tsx
const nextLabel = slide.type === 'quiz' && state.answers[slide.id] ? course.ui.continue : course.ui.next;
```

```tsx
<button onClick={() => dispatch({ type: 'NEXT' })} disabled={!canContinue}>{nextLabel}</button>
```

- [ ] **Step 4: Replace `public/course.json` with the complete nine-definition course**

Use the schema from the design spec and include these exact IDs and routing edges:

```json
{
  "course": { "id": "coffee-brewing-intro", "version": "1.0.0", "title": "咖啡冲煮入门", "presenter": "AI 课程助教", "brand": { "primary": "#4A2C1A", "accent": "#D89A4E", "background": "#F7F0E5", "text": "#2B211B", "logo": "assets/logo.png" } },
  "ui": { "navigation": "课件导航", "previous": "上一页", "next": "下一页", "continue": "继续", "showDetail": "查看明细", "closeDetail": "关闭明细", "exportPdf": "导出完整 PDF", "openTools": "扩展工具", "recordStatus": "学习记录状态", "restartCourse": "重新开始课程", "validationResult": "配置校验结果" },
  "slides": [
    { "id": "cover", "type": "cover", "title": "咖啡冲煮入门", "subtitle": "从风味、变量到一杯稳定的手冲", "image": "assets/coffee-hero.png", "imageAlt": "陶瓷手冲滤杯、咖啡豆与晨光" },
    { "id": "beans", "type": "content", "title": "三大产区与风味", "bullets": ["非洲：明亮花果酸香", "中南美：坚果与巧克力调", "亚洲：醇厚、香料感与较低酸度", "烘焙度会改变这些风味的表达"] },
    { "id": "caffeine", "type": "chart", "title": "常见饮品咖啡因含量对比", "chart": { "kind": "bar", "unit": "mg", "clickable": true, "series": [{ "label": "意式浓缩", "value": 63, "detail": "det_espresso" }, { "label": "手冲", "value": 145, "detail": "det_pour" }, { "label": "冷萃", "value": 200, "detail": "det_cold" }] } },
    { "id": "steps", "type": "content", "title": "手冲咖啡基本步骤", "bullets": ["称量咖啡豆与水，确定粉水比", "研磨后润湿滤纸并预热器具", "先闷蒸，再分段稳定注水", "记录总时间并根据风味调整"] },
    { "id": "quiz1", "type": "quiz", "question": "你平时怎么喝咖啡？", "options": [{ "id": "basic", "text": "速溶 / 不常喝", "goto": "branch_basic", "initialVotes": 12 }, { "id": "pro", "text": "手冲 / 意式", "goto": "branch_pro", "initialVotes": 8 }] },
    { "id": "branch_basic", "type": "content", "title": "入门路径建议", "bullets": ["先固定一种豆和一种器具", "使用电子秤记录粉水比", "每次只改变一个变量"], "next": "extract" },
    { "id": "branch_pro", "type": "content", "title": "进阶路径建议", "bullets": ["对比不同研磨度与水温", "记录分段注水对萃取的影响", "用风味反馈反推配方"], "next": "extract" },
    { "id": "extract", "type": "chart", "title": "不同冲煮方式萃取率对比", "chart": { "kind": "bar", "unit": "%", "clickable": true, "series": [{ "label": "法压", "value": 18, "detail": "det_press" }, { "label": "手冲", "value": 20, "detail": "det_filter" }, { "label": "意式", "value": 22, "detail": "det_espresso_extract" }] } },
    { "id": "end", "type": "cta", "title": "先记录，再调整", "body": "下一杯只改变一个变量，把感受写下来。", "action": { "label": "领取冲煮参数手册", "href": "assets/brewing-parameters.txt" } }
  ],
  "details": {
    "det_espresso": { "title": "意式浓缩", "facts": ["参考容量约 30 ml", "高压短时萃取", "单份总咖啡因不一定最高"] },
    "det_pour": { "title": "手冲", "facts": ["参考容量约 240 ml", "重力过滤萃取", "饮用总量影响咖啡因摄入"] },
    "det_cold": { "title": "冷萃", "facts": ["参考容量约 350 ml", "低温长时浸泡", "配方与稀释比例差异较大"] },
    "det_press": { "title": "法压", "facts": ["浸泡式萃取", "口感醇厚", "示例萃取率 18%"] },
    "det_filter": { "title": "手冲", "facts": ["过滤式萃取", "风味清晰", "示例萃取率 20%"] },
    "det_espresso_extract": { "title": "意式", "facts": ["高压快速萃取", "浓度高", "示例萃取率 22%"] }
  }
}
```

- [ ] **Step 5: Add interactive styling, run both paths, and commit**

Append to `src/styles.css`:

```css
.bar-button{appearance:none;border:0;background:var(--accent);color:#2B211B;min-width:92px;position:relative;border-radius:10px 10px 0 0;cursor:pointer}.bar-button strong{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:10px;white-space:nowrap}.bar-button>span{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);font-weight:800}.bar-button:focus-visible{outline:3px solid var(--primary);outline-offset:4px}.detail-panel{position:absolute;right:0;top:0;width:38%;height:100%;overflow:auto;background:#FFF9F0;color:#2B211B;border-left:2px solid #D8C7B5;padding:38px}.quiz-options button[aria-pressed="true"]{background:var(--primary);color:#fff;border-color:var(--primary)}.quiz-results{display:grid;gap:12px}.quiz-results>div{display:grid;grid-template-columns:180px 1fr 44px;align-items:center;gap:12px}.quiz-results progress{width:100%;accent-color:var(--accent)}
```

Run `npm test` and `npm run build`.

Expected: all tests PASS and build exits 0. Browser-check both quiz options, both branch pages, back navigation, answer change, and both chart details.

```bash
git add public/course.json src/slides.tsx src/pages.tsx src/styles.css src/session.ts tests/session.test.ts
git commit -m "feat: add quiz branching and chart drill-down"
```

---

### Task 5: Persist Incremental Learning Records Locally

**Files:**
- Create: `server/session-store.mjs`
- Create: `server.mjs`
- Create: `src/recorder.ts`
- Create: `tests/session-store.test.ts`
- Create: `tests/recorder.test.ts`
- Modify: `package.json`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `CourseConfig`, `SessionState`, and navigation callbacks.
- Produces: `SessionTracker`, `createRemoteSession`, `saveRemoteSession`, `RecordingStatus`, `createRecord(recordsDir, course)`, and `updateRecord(recordsDir, id, snapshot)`.

- [ ] **Step 1: Write failing atomic-store tests**

Create `tests/session-store.test.ts`:

```ts
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createRecord, isSessionId, updateRecord } from '../server/session-store.mjs';

describe('session store', () => {
  it('creates different files for different runs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'records-'));
    const a = await createRecord(dir, { id: 'course', version: '1' });
    const b = await createRecord(dir, { id: 'course', version: '1' });
    expect(a.sessionId).not.toBe(b.sessionId);
  });

  it('atomically updates the server-owned file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'records-'));
    const created = await createRecord(dir, { id: 'course', version: '1' });
    const snapshot = { ...created, status: 'completed', updatedAt: new Date().toISOString(), completedAt: new Date().toISOString() };
    await updateRecord(dir, created.sessionId, snapshot);
    expect(JSON.parse(await readFile(join(dir, `${created.sessionId}.json`), 'utf8')).status).toBe('completed');
  });

  it('rejects path traversal', () => expect(isSessionId('../outside')).toBe(false));

  it('rejects malformed snapshots', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'records-'));
    const created = await createRecord(dir, { id: 'course', version: '1' });
    await expect(updateRecord(dir, created.sessionId, { ...created, visitedPath: 'cover' })).rejects.toThrow(/invalid session snapshot/);
  });
});
```

Run `npm test -- tests/session-store.test.ts`.

Expected: FAIL because `server/session-store.mjs` does not exist.

- [ ] **Step 2: Implement UUID-only atomic persistence**

Create `server/session-store.mjs`:

```js
import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isSessionId = (value) => typeof value === 'string' && UUID.test(value);
const isText = (value) => typeof value === 'string' && value.length > 0;
const isIsoDate = (value) => value === null || (isText(value) && !Number.isNaN(Date.parse(value)));

function validSnapshot(value) {
  return value && value.schemaVersion === 1 && isSessionId(value.sessionId) &&
    isText(value.courseId) && isText(value.courseVersion) &&
    ['in_progress', 'completed'].includes(value.status) &&
    isIsoDate(value.startedAt) && isIsoDate(value.updatedAt) && isIsoDate(value.completedAt) &&
    isText(value.lastSlideId) && Array.isArray(value.visitedPath) && value.visitedPath.every(isText) &&
    Number.isFinite(value.totalActiveMs) && value.totalActiveMs >= 0 &&
    Array.isArray(value.slideSegments) && Array.isArray(value.featureEvents);
}

export async function createRecord(recordsDir, course) {
  if (!course || !isText(course.id) || !isText(course.version)) throw new Error('invalid course identity');
  await mkdir(recordsDir, { recursive: true });
  const now = new Date().toISOString();
  const record = { schemaVersion: 1, sessionId: randomUUID(), courseId: course.id, courseVersion: course.version, status: 'in_progress', startedAt: now, updatedAt: now, completedAt: null, lastSlideId: '', visitedPath: [], totalActiveMs: 0, slideSegments: [], featureEvents: [] };
  await writeFile(join(recordsDir, `${record.sessionId}.json`), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  return record;
}

export async function updateRecord(recordsDir, sessionId, snapshot) {
  if (!isSessionId(sessionId) || snapshot?.sessionId !== sessionId || !validSnapshot(snapshot)) throw new Error('invalid session snapshot');
  const finalPath = join(recordsDir, `${sessionId}.json`);
  const tempPath = join(recordsDir, `${sessionId}.${randomUUID()}.tmp`);
  await writeFile(tempPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(tempPath, finalPath);
}
```

Run `npm test -- tests/session-store.test.ts`.

Expected: 4 tests PASS.

- [ ] **Step 3: Write failing active-time tests**

Create `tests/recorder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SessionTracker } from '../src/recorder';

describe('SessionTracker', () => {
  it('excludes hidden time and retains an unfinished segment', () => {
    const tracker = new SessionTracker('cover', 0);
    tracker.setVisible(false, 1000);
    tracker.setVisible(true, 5000);
    const snapshot = tracker.snapshot(6000);
    expect(snapshot.totalActiveMs).toBe(2000);
    expect(snapshot.slideSegments[0]).toMatchObject({ slideId: 'cover', activeMs: 2000, leftAt: null });
  });

  it('records completed slides and feature duration', () => {
    const tracker = new SessionTracker('chart', 0);
    tracker.startFeature('chart_drill', 'chart', 200);
    tracker.endFeature('chart_drill', 'chart', 700);
    tracker.changeSlide('quiz', 1000);
    const snapshot = tracker.snapshot(1000);
    expect(snapshot.slideSegments[0].activeMs).toBe(1000);
    expect(snapshot.featureEvents[0].durationMs).toBe(500);
  });

  it('excludes hidden time from an open feature and snapshots it before exit', () => {
    const tracker = new SessionTracker('chart', 0);
    tracker.startFeature('chart_drill', 'chart', 100);
    tracker.setVisible(false, 400);
    tracker.setVisible(true, 1400);
    expect(tracker.snapshot(1600).featureEvents[0].durationMs).toBe(500);
  });
});
```

Run `npm test -- tests/recorder.test.ts`.

Expected: FAIL because `src/recorder.ts` does not exist.

- [ ] **Step 4: Implement the tracker and client API**

Create `src/recorder.ts`:

```ts
export type SlideSegment = { slideId: string; enteredAt: number; leftAt: number | null; activeMs: number };
export type FeatureEvent = { type: string; slideId: string; startedAt: number; endedAt: number; durationMs: number };
export type RecordingStatus = { enabled: boolean; sessionId: string | null; lastSavedAt: string | null; error: string | null };

export class SessionTracker {
  private current: SlideSegment;
  private activeSince: number | null;
  private completed: SlideSegment[] = [];
  private features: FeatureEvent[] = [];
  private openFeatures = new Map<string, { type: string; slideId: string; startedAt: number; activeMs: number; activeSince: number | null }>();
  constructor(slideId: string, now = Date.now()) { this.current = { slideId, enteredAt: now, leftAt: null, activeMs: 0 }; this.activeSince = now; }
  private accrue(now: number) { if (this.activeSince !== null) { this.current.activeMs += now - this.activeSince; this.activeSince = now; } }
  private accrueFeature(value: { activeMs: number; activeSince: number | null }, now: number) { if (value.activeSince !== null) { value.activeMs += now - value.activeSince; value.activeSince = now; } }
  setVisible(visible: boolean, now = Date.now()) {
    if (visible && this.activeSince === null) { this.activeSince = now; for (const value of this.openFeatures.values()) value.activeSince = now; }
    else if (!visible && this.activeSince !== null) { this.accrue(now); this.activeSince = null; for (const value of this.openFeatures.values()) { this.accrueFeature(value, now); value.activeSince = null; } }
  }
  changeSlide(nextId: string, now = Date.now()) { this.accrue(now); this.completed.push({ ...this.current, leftAt: now }); this.current = { slideId: nextId, enteredAt: now, leftAt: null, activeMs: 0 }; if (this.activeSince !== null) this.activeSince = now; }
  startFeature(type: string, slideId: string, now = Date.now()) { this.openFeatures.set(`${type}:${slideId}`, { type, slideId, startedAt: now, activeMs: 0, activeSince: this.activeSince === null ? null : now }); }
  endFeature(type: string, slideId: string, now = Date.now()) { const key = `${type}:${slideId}`; const value = this.openFeatures.get(key); if (!value) return; this.accrueFeature(value, now); this.features.push({ type, slideId, startedAt: value.startedAt, endedAt: now, durationMs: value.activeMs }); this.openFeatures.delete(key); }
  addEvent(type: string, slideId: string, now = Date.now()) { this.features.push({ type, slideId, startedAt: now, endedAt: now, durationMs: 0 }); }
  snapshot(now = Date.now()) {
    const activeMs = this.current.activeMs + (this.activeSince === null ? 0 : now - this.activeSince);
    const current = { ...this.current, activeMs };
    const slideSegments = [...this.completed, current];
    const open = [...this.openFeatures.values()].map((value) => ({ type: value.type, slideId: value.slideId, startedAt: value.startedAt, endedAt: now, durationMs: value.activeMs + (value.activeSince === null ? 0 : now - value.activeSince) }));
    return { slideSegments, featureEvents: [...this.features, ...open], totalActiveMs: slideSegments.reduce((sum, item) => sum + item.activeMs, 0) };
  }
}

export async function recordingAvailable() {
  try { const response = await fetch('/api/health'); return response.ok && (await response.json()).recording === true; } catch { return false; }
}
export async function createRemoteSession(course: { id: string; version: string }) {
  const response = await fetch('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(course) });
  if (!response.ok) throw new Error(`create session failed: ${response.status}`);
  return response.json();
}
export async function saveRemoteSession(sessionId: string, snapshot: unknown, beacon = false) {
  const body = JSON.stringify(snapshot);
  if (beacon) return navigator.sendBeacon(`/api/sessions/${sessionId}`, new Blob([body], { type: 'application/json' }));
  const response = await fetch(`/api/sessions/${sessionId}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  if (!response.ok) throw new Error(`save session failed: ${response.status}`);
  return true;
}
```

Run `npm test -- tests/recorder.test.ts`.

Expected: 3 tests PASS.

- [ ] **Step 5: Expose the local API through one server**

Create `server.mjs`:

```js
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRecord, updateRecord } from './server/session-store.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const recordsDir = join(root, 'records');
const production = process.argv.includes('--production');
const app = express();
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ recording: true }));
app.post('/api/sessions', async (req, res, next) => { try { res.status(201).json(await createRecord(recordsDir, req.body)); } catch (error) { next(error); } });
app.post('/api/sessions/:id', async (req, res, next) => { try { await updateRecord(recordsDir, req.params.id, req.body); res.status(204).end(); } catch (error) { next(error); } });
if (production) {
  app.use(express.static(join(root, 'dist')));
  app.use((_req, res) => res.sendFile(join(root, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((error, _req, res, _next) => res.status(400).json({ error: error instanceof Error ? error.message : String(error) }));
app.listen(5173, () => console.log('Course engine: http://localhost:5173/course'));
```

Change the two server scripts in `package.json` to:

```json
{
  "scripts": {
    "dev": "node server.mjs",
    "start": "node server.mjs --production"
  }
}
```

Preserve the existing `build` and `test` scripts while making this edit.

- [ ] **Step 6: Add a complete reducer-observing recording hook**

Add these imports at the top of `src/recorder.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CourseConfig } from './course';
import type { SessionState } from './session';
```

Append this hook to `src/recorder.ts`:

```ts
export function useSessionRecorder(course: CourseConfig, state: SessionState, active: boolean) {
  const tracker = useRef(new SessionTracker(state.currentId));
  const remote = useRef<Record<string, unknown> | null>(null);
  const previous = useRef(state);
  const latest = useRef(state);
  const pending = useRef<Record<string, unknown> | null>(null);
  const saving = useRef(false);
  const [status, setStatus] = useState<RecordingStatus>({ enabled: false, sessionId: null, lastSavedAt: null, error: null });

  const buildSnapshot = useCallback((value: SessionState) => {
    if (!remote.current) return null;
    const now = new Date().toISOString();
    const slide = course.slides.find((item) => item.id === value.currentId);
    const completed = slide?.type === 'cta';
    return { ...remote.current, status: completed ? 'completed' : 'in_progress', updatedAt: now, completedAt: completed ? now : null, lastSlideId: value.currentId, visitedPath: value.visitedPath, ...tracker.current.snapshot() };
  }, [course]);

  const drain = useCallback(async () => {
    if (saving.current || !status.sessionId) return;
    saving.current = true;
    while (pending.current) {
      const value = pending.current;
      pending.current = null;
      try {
        await saveRemoteSession(status.sessionId, value);
        setStatus((current) => ({ ...current, lastSavedAt: new Date().toISOString(), error: null }));
      } catch (error) {
        pending.current = value;
        setStatus((current) => ({ ...current, error: String(error) }));
        break;
      }
    }
    saving.current = false;
  }, [status.sessionId]);

  const queue = useCallback((value: SessionState) => {
    const snapshot = buildSnapshot(value);
    if (!snapshot) return;
    pending.current = snapshot;
    void drain();
  }, [buildSnapshot, drain]);

  const startNewSession = useCallback(async (initialState = latest.current) => {
    if (!await recordingAvailable()) {
      setStatus({ enabled: false, sessionId: null, lastSavedAt: null, error: null });
      return;
    }
    try {
      const created = await createRemoteSession({ id: course.course.id, version: course.course.version });
      remote.current = created;
      tracker.current = new SessionTracker(initialState.currentId);
      const snapshot = buildSnapshot(initialState);
      if (snapshot) await saveRemoteSession(created.sessionId, snapshot);
      setStatus({ enabled: true, sessionId: created.sessionId, lastSavedAt: new Date().toISOString(), error: null });
    } catch (error) {
      remote.current = null;
      setStatus({ enabled: false, sessionId: null, lastSavedAt: null, error: String(error) });
    }
  }, [buildSnapshot, course.course.id, course.course.version]);

  useEffect(() => { if (active && !remote.current) void startNewSession(); }, [active, startNewSession]);

  useEffect(() => {
    const before = previous.current;
    latest.current = state;
    if (before.currentId !== state.currentId) tracker.current.changeSlide(state.currentId);
    for (const [slideId, optionId] of Object.entries(state.answers)) if (before.answers[slideId] !== optionId) tracker.current.addEvent('quiz_answer', slideId);
    if (before.selectedDetail && before.selectedDetail !== state.selectedDetail) tracker.current.endFeature('chart_drill', before.currentId);
    if (state.selectedDetail && before.selectedDetail !== state.selectedDetail) tracker.current.startFeature('chart_drill', state.currentId);
    previous.current = state;
    queue(state);
  }, [queue, state]);

  useEffect(() => {
    tracker.current.setVisible(active && !document.hidden);
    queue(latest.current);
  }, [active, queue]);

  useEffect(() => {
    const onVisibility = () => { tracker.current.setVisible(active && !document.hidden); queue(latest.current); };
    const onPageHide = () => {
      const snapshot = buildSnapshot(latest.current);
      if (snapshot && status.sessionId) void saveRemoteSession(status.sessionId, snapshot, true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    addEventListener('pagehide', onPageHide);
    return () => { document.removeEventListener('visibilitychange', onVisibility); removeEventListener('pagehide', onPageHide); };
  }, [active, buildSnapshot, queue, status.sessionId]);

  const addEvent = useCallback((type: string) => { tracker.current.addEvent(type, latest.current.currentId); queue(latest.current); }, [queue]);
  return { status, addEvent };
}
```

This observer creates one snapshot after reducer state changes, so navigation, answers, branch changes, and detail open/close cannot forget to record themselves.

- [ ] **Step 7: Wire the hook at shared application scope**

Add these imports to `src/App.tsx`:

```ts
import { useLocation } from 'react-router-dom';
import { useSessionRecorder } from './recorder';
```

Inside `LoadedApp`, after `useReducer`, add:

```ts
const location = useLocation();
const recorder = useSessionRecorder(course, state, location.pathname === '/course');
```

The `BrowserRouter` remains outside `App`, so `useLocation()` is valid. Keep `recorder` in `LoadedApp`; Task 6 passes it to the tools route.

- [ ] **Step 8: Verify incremental files and commit**

Run:

```bash
npm test
npm run dev
```

Expected: tests PASS; opening `/course` creates one `records/<uuid>.json`; navigating one page updates `lastSlideId`, `visitedPath`, and `slideSegments`; switching tabs stops active time growth; reloading creates a second file.

```bash
git add package.json server.mjs server/session-store.mjs src/recorder.ts src/App.tsx tests/recorder.test.ts tests/session-store.test.ts
git commit -m "feat: persist incremental learning records"
```

---

### Task 6: Separate Tools and Complete-Course Print Routes

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: shared course/session/recording state.
- Produces: `/tools`, `/print`, a tool-only export action, print-safe complete branch output, and no teaching-time accumulation outside `/course`.

- [ ] **Step 1: Add `/tools` and `/print` routes above the fallback route**

In `LoadedApp`, add:

```tsx
<Route path="/tools" element={<ToolsPage course={course} recording={recorder.status} onExport={() => recorder.addEvent('pdf_export')} onRestart={() => window.location.assign('/course')} />} />
<Route path="/print" element={<PrintPage course={course} />} />
```

Import `ToolsPage` and `PrintPage` from `./pages`. The recording hook from Task 5 remains the only owner of the local session file.
Restart intentionally performs a full navigation: `pagehide` flushes the old run, the reducer resets with the new document, and the recorder creates a different server-owned JSON file.

- [ ] **Step 2: Implement the independent tool and print pages**

Append to `src/pages.tsx`:

```tsx
import { Link } from 'react-router-dom';
import type { RecordingStatus } from './recorder';
import { createInitialState } from './session';

export function ToolsPage({ course, recording, onRestart, onExport }: { course: CourseConfig; recording: RecordingStatus; onRestart: () => void; onExport: () => void }) {
  return <main className="tools-page"><header><p className="eyebrow">{course.course.title}</p><h1>{course.ui.openTools}</h1></header><section className="tool-grid"><article><h2>{course.ui.exportPdf}</h2><Link className="primary-action" to="/print" target="_blank" onClick={onExport}>{course.ui.exportPdf}</Link></article>{(recording.enabled || recording.error) && <article><h2>{course.ui.recordStatus}</h2>{recording.sessionId && <code>{recording.sessionId}</code>}{recording.lastSavedAt && <time>{recording.lastSavedAt}</time>}{recording.error && <p>{recording.error}</p>}</article>}<article><h2>{course.ui.validationResult}</h2><strong>{course.slides.length}</strong></article><article><h2>{course.ui.restartCourse}</h2><button className="primary-action" onClick={onRestart}>{course.ui.restartCourse}</button></article></section><Link to="/course">{course.ui.previous}</Link></main>;
}

export function PrintPage({ course }: { course: CourseConfig }) {
  const state = createInitialState(course);
  useEffect(() => {
    let cancelled = false;
    const printWhenReady = async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.addEventListener('load', () => resolve(), { once: true }); image.addEventListener('error', () => resolve(), { once: true }); })));
      if (!cancelled) window.print();
    };
    void printWhenReady();
    return () => { cancelled = true; };
  }, []);
  return <main className="print-deck">{course.slides.map((slide) => <section className="print-slide" key={slide.id}><SlideRenderer course={course} slide={slide} state={state} dispatch={() => undefined} print /></section>)}</main>;
}
```

Add a small non-fullscreen link to tools in `CoursePage`, outside `.stage`:

```tsx
<Link className="tools-link" to="/tools">{course.ui.openTools}</Link>
```

The route change makes `active` false in `useSessionRecorder`, which closes and flushes the current segment. Do not add a second navigation callback, and do not place export or record controls inside any slide.

- [ ] **Step 3: Add exact print and tools CSS**

Append to `src/styles.css`:

```css
.tools-link{position:fixed;right:24px;top:20px;color:var(--primary);font-weight:700}.tools-page{min-height:100vh;padding:48px;background:var(--canvas);color:var(--ink)}.tools-page h1{color:var(--primary);font-size:52px}.tool-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.tool-grid article{background:#FFF9F0;color:#2B211B;border:1px solid #D8C7B5;border-radius:16px;padding:24px}.print-deck{background:#fff}.print-slide{width:100vw;aspect-ratio:16/9;break-after:page;page-break-after:always;position:relative;overflow:hidden;background:var(--canvas)}.print-slide .slide{min-height:100%;box-shadow:none}.print-slide .chart{grid-template-rows:auto 2.2in auto;align-content:stretch;gap:12px;padding:30px}.print-slide .bars{height:2.2in}.print-slide .detail-panel{position:static;width:100%;height:auto;border:0;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px}.print-slide .detail-panel h3{margin:0;font-size:18px}.print-slide .detail-panel li{font-size:14px;line-height:1.35}.print-slide .course-nav,.print-slide button{pointer-events:none}@page{size:13.333in 7.5in;margin:0}@media print{body{background:#fff!important}.tools-link,.course-nav{display:none!important}.print-slide{width:13.333in;height:7.5in;print-color-adjust:exact;-webkit-print-color-adjust:exact}.print-slide:last-child{break-after:auto;page-break-after:auto}}
```

- [ ] **Step 4: Browser-check route boundaries and PDF content**

Run `npm run dev` and verify local mode. Then stop it and run `npx vite preview --host 127.0.0.1 --port 4173` to verify the built static mode without the local API:

1. `/course` shows eight runtime pages on either branch and no PDF/record card inside the CTA.
2. Opening `/tools` ends the active slide segment and pauses active time.
3. Static deployment without `/api/health` hides the record-status card.
4. `/print` shows nine slide definitions, both branch titles, every detail fact, and no tools page.
5. The browser print preview reports nine 16:9 pages without clipped text.

- [ ] **Step 5: Commit route separation**

```bash
git add src/App.tsx src/pages.tsx src/styles.css
git commit -m "feat: separate course tools and print routes"
```

---

### Task 7: Prove Course Replacement and Harden Failure States

**Files:**
- Create: `fixtures/course-alt.json`
- Create: `public/assets/disaster-logo.svg`
- Create: `public/assets/disaster-checklist.txt`
- Create: `tests/course-alt.test.ts`
- Modify: `src/course.ts`
- Modify: `src/App.tsx`
- Modify: `src/pages.tsx`
- Modify: `public/sources.json`

**Interfaces:**
- Consumes: `validateCourse` and the same five slide types.
- Produces: A second-domain validation fixture and actionable config/asset errors without code changes.

- [ ] **Step 1: Create a completely different course fixture**

Create `fixtures/course-alt.json` as a nine-definition course titled `城市防灾入门`. Use the same structural IDs only where the engine requires none; use domain-specific IDs such as `disaster-cover`, `warning-signs`, `supply-chart`, `evacuation-steps`, `disaster-quiz`, `home-route`, `office-route`, `response-chart`, and `disaster-end`. Include two chart details, two quiz options with distinct `goto` values, explicit branch `next` values, local colors, and no coffee wording or coffee assets.

The file must use this course header and CTA exactly:

```json
{
  "course": { "id": "city-disaster-basics", "version": "1.0.0", "title": "城市防灾入门", "presenter": "社区安全讲师", "brand": { "primary": "#16324F", "accent": "#E07A3F", "background": "#F3F7FA", "text": "#14202B", "logo": "assets/disaster-logo.svg" } },
  "ui": { "navigation": "课件导航", "previous": "上一页", "next": "下一页", "continue": "查看建议", "showDetail": "查看明细", "closeDetail": "关闭明细", "exportPdf": "导出完整 PDF", "openTools": "扩展工具", "recordStatus": "学习记录状态", "restartCourse": "重新开始课程", "validationResult": "配置校验结果" },
  "slides": [
    { "id": "disaster-cover", "type": "cover", "title": "城市防灾入门", "subtitle": "识别风险，准备行动" },
    { "id": "warning-signs", "type": "content", "title": "先认识预警信号", "bullets": ["关注官方预警渠道", "区分提示、警报与解除信息", "不传播未经核实的消息"] },
    { "id": "supply-chart", "type": "chart", "title": "家庭应急物资建议数量", "chart": { "kind": "bar", "unit": "份", "clickable": true, "series": [{ "label": "饮用水", "value": 9, "detail": "water" }, { "label": "即食食品", "value": 6, "detail": "food" }] } },
    { "id": "evacuation-steps", "type": "content", "title": "疏散四步", "bullets": ["判断风险方向", "关闭危险源", "携带应急包", "沿安全路线撤离"] },
    { "id": "disaster-quiz", "type": "quiz", "question": "你最常停留在哪里？", "options": [{ "id": "home", "text": "住宅", "goto": "home-route", "initialVotes": 10 }, { "id": "office", "text": "办公场所", "goto": "office-route", "initialVotes": 8 }] },
    { "id": "home-route", "type": "content", "title": "住宅检查重点", "bullets": ["固定高大家具", "标出燃气总阀", "约定家庭集合点"], "next": "response-chart" },
    { "id": "office-route", "type": "content", "title": "办公场所检查重点", "bullets": ["确认两个安全出口", "熟悉消防器材位置", "服从现场疏散指引"], "next": "response-chart" },
    { "id": "response-chart", "type": "chart", "title": "一分钟行动优先级", "chart": { "kind": "bar", "unit": "分", "clickable": true, "series": [{ "label": "确认风险", "value": 5, "detail": "risk" }, { "label": "执行撤离", "value": 8, "detail": "leave" }] } },
    { "id": "disaster-end", "type": "cta", "title": "今天完成一次路线检查", "body": "从常驻地点走到安全出口，并记录阻碍。", "action": { "label": "查看家庭检查清单", "href": "assets/disaster-checklist.txt" } }
  ],
  "details": {
    "water": { "title": "饮用水", "facts": ["按家庭人数准备", "定期检查保质期"] },
    "food": { "title": "即食食品", "facts": ["无需加热", "兼顾特殊饮食需求"] },
    "risk": { "title": "确认风险", "facts": ["观察现场", "获取官方信息"] },
    "leave": { "title": "执行撤离", "facts": ["不使用电梯", "帮助需要协助的人"] }
  }
}
```

Create `public/assets/disaster-logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="防灾盾牌"><path fill="#16324F" d="M64 8 110 25v34c0 30-18 50-46 61C36 109 18 89 18 59V25z"/><path fill="#E07A3F" d="M58 31h12v27h23v12H70v27H58V70H35V58h23z"/></svg>
```

Create `public/assets/disaster-checklist.txt`:

```text
家庭防灾检查清单

□ 确认两个可用出口与一个家庭集合点
□ 固定高大家具，保持通道畅通
□ 标记水、电、燃气总阀位置
□ 准备饮用水、即食食品、照明和常用药
□ 记录本地官方预警与求助渠道
□ 每六个月检查一次物资与路线
```

Append this object to `public/sources.json`:

```json
{ "id": "alternate-course-assets", "type": "ai-generated", "tool": "OpenAI Codex", "promptSummary": "Generate a minimal disaster shield SVG and household safety checklist", "purpose": "alternate course replacement proof" }
```

- [ ] **Step 2: Write and run the replacement validation test**

Create `tests/course-alt.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateCourse } from '../src/course';

describe('replacement course', () => {
  it('uses the same engine contract without coffee content', () => {
    const raw = readFileSync('fixtures/course-alt.json', 'utf8');
    const course = validateCourse(JSON.parse(raw));
    expect(course.course.id).toBe('city-disaster-basics');
    expect(course.slides).toHaveLength(9);
    expect(raw).not.toMatch(/咖啡|手冲|萃取/);
  });
});
```

Run `npm test -- tests/course-alt.test.ts`.

Expected: 1 test PASS.

- [ ] **Step 3: Add asset preflight to config validation**

Add this export to `src/course.ts`:

```ts
export async function findMissingAssets(course: CourseConfig) {
  const paths = new Set<string>([course.course.brand.logo]);
  for (const slide of course.slides) {
    if ((slide.type === 'cover' || slide.type === 'content') && slide.image) paths.add(slide.image);
    if (slide.type === 'cta') paths.add(slide.action.href);
  }
  const results = await Promise.all([...paths].map(async (path) => {
    try { return { path, ok: (await fetch(path, { method: 'HEAD' })).ok }; }
    catch { return { path, ok: false }; }
  }));
  return results.filter((item) => !item.ok).map((item) => item.path);
}
```

In `App.tsx`, import `findMissingAssets`, add `const [missingAssets, setMissingAssets] = useState<string[]>([])`, and replace the loading effect body with:

```tsx
useEffect(() => {
  loadCourse()
    .then(async (value) => { setMissingAssets(await findMissingAssets(value)); setCourse(value); })
    .catch((value) => setError(value instanceof CourseConfigError ? value.errors : [String(value)]));
}, []);
```

Pass `missingAssets` into `LoadedApp`, add it to that component's prop type, and update the `/tools` route to include `missingAssets={missingAssets}`. Add `missingAssets: string[]` to `ToolsPage` props and replace its validation card with:

```tsx
<article><h2>{course.ui.validationResult}</h2><strong>{missingAssets.length}</strong>{missingAssets.length > 0 && <ul>{missingAssets.map((path) => <li key={path}><code>{path}</code></li>)}</ul>}</article>
```

Structural `CourseConfigError` remains blocking and displays every error line; missing assets remain non-blocking and actionable on `/tools`.

- [ ] **Step 4: Perform the no-code replacement smoke check**

With the dev server stopped, run:

```bash
cp public/course.json /tmp/coffee-course.json
cp fixtures/course-alt.json public/course.json
npm run dev
```

Expected: `/course` displays `城市防灾入门`, both disaster branches work, and no code file changes.

Stop the server and restore:

```bash
cp /tmp/coffee-course.json public/course.json
git diff --exit-code -- public/course.json
```

Expected: `git diff` exits 0.

- [ ] **Step 5: Commit replacement proof**

```bash
git add fixtures/course-alt.json public/assets/disaster-logo.svg public/assets/disaster-checklist.txt public/sources.json tests/course-alt.test.ts src/course.ts src/App.tsx src/pages.tsx
git commit -m "test: prove no-code course replacement"
```

---

### Task 8: Finish Documentation, Samples, PDF, and Delivery Verification

**Files:**
- Create: `README.md`
- Create: `examples/learning-record.json`
- Create: `exports/course.pdf`
- Modify: `public/sources.json`
- Modify: `docs/skills/Contract.md`

**Interfaces:**
- Consumes: The finished runtime and all verification commands.
- Produces: The exact submission artifacts and a reproducible operator guide.

- [ ] **Step 1: Create the README with runnable commands and field guidance**

Create `README.md` with these exact sections and facts:

````markdown
# 数据驱动的交互式课件引擎

## Requirements

- Node.js 24 or newer
- macOS Google Chrome for PDF export

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/course`. Local mode creates incremental records under `records/`.

## Static build

```bash
npm run build
```

Deploy `dist/` to any static host. Static mode keeps teaching and PDF printing but disables learning records.

## Routes

- `/course`: teaching only
- `/tools`: export, record status, restart, validation
- `/print`: complete nine-definition PDF view

## Replace the course

Replace only `public/course.json`; use configured HTTPS or base64 raster data images when new assets are needed. Do not edit code. `fixtures/course-alt.json` proves a different course can use the same engine.

## JSON contract

Document `course`, `ui`, the five `slides[].type` shapes, `next`, quiz `goto`, chart `detail`, CTA `action`, and `details` using the field names from `src/course.ts`.

## Export PDF

Run `npm run export:pdf`. The command builds the project, starts and stops a temporary server, and writes the tracked delivery file to `exports/course.pdf`. The PDF contains both branches and all chart details; it excludes `/tools`.

## Learning records

Local `/course` runs create `records/<uuid>.json`. A new file is created on reload or restart. Active time excludes hidden-tab and tools-page time. Generated records are git-ignored.

## Verification

```bash
npm test
npm run build
```

Also walk both branches, inspect both drill-down charts, verify the alternate JSON, and inspect every PDF page.
````

- [ ] **Step 2: Create a reviewed example record**

Copy one completed runtime file into `examples/learning-record.json`. It must contain `status: "completed"`, eight `visitedPath` items, non-zero `totalActiveMs`, at least one `quiz_answer` event, and at least one `chart_drill` event. Remove no schema fields and confirm it contains no name, email, IP address, or device identifier.

- [ ] **Step 3: Produce and inspect the PDF**

Run `npm run export:pdf`. Confirm that it exits with status 0 and writes `exports/course.pdf` without browser interaction.

Use the `pdf` skill to render and inspect every page. Expected:

- 9 pages exactly.
- Both `入门路径建议` and `进阶路径建议` exist.
- All six chart detail blocks exist.
- `/tools`, record status, restart, and validation controls do not exist.
- No clipping, overlap, missing Chinese glyph, low-contrast text, or accidental blank page.

- [ ] **Step 4: Run the complete verification gate**

Run:

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected: all tests PASS; build exits 0; `git diff --check` prints nothing. Before the final commit, `git status --short` lists only the intended README, source audit, example record, PDF, and Contract changes.

Manually verify both runtime branches, return-and-change-answer behavior, hidden-tab timing, local incremental files, static record disabling, tool-route isolation, alternate course replacement, and PDF contents.

- [ ] **Step 5: Finalize the living contract and commit deliverables**

Append to `docs/skills/Contract.md`:

```markdown
- A runtime path contains 8 teaching pages; the complete print output contains 9 configured definitions.
- Reloading `/course` intentionally creates a new record and leaves the previous file `in_progress`.
- Generated record files stay ignored; only the reviewed example is committed.
- The final PDF must contain both branches and all details, and must exclude the tools page.
```

```bash
git add README.md public/sources.json examples/learning-record.json exports/course.pdf docs/skills/Contract.md
git commit -m "docs: complete course engine delivery"
```

Run `git status --short` once more.

Expected: no output.
