# JSON-Driven Course Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/course` and `/print` fully driven by `public/course.json`, align the sample course with Appendix A, support safe HTTPS images, and leave auditable before/after evidence.

**Architecture:** Keep the existing `course` / `ui` / `slides` / `details` configuration and React entry point. Extend only fields needed for visible content and theme tokens, inject JSON colors as CSS variables, validate image/action protocols at the shared loader boundary, and expose small pure rendering/image helpers for Vitest evidence.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, native CSS variables, browser print API.

## Global Constraints

- Appendix A defines sample-course content and order; Appendix B defines minimum field semantics.
- `/course` and `/print` visible course content, labels, image addresses, colors, order, chart data, and CTA behavior come from `public/course.json`.
- `/tools` generic engine copy may remain fixed.
- Replacing only `public/course.json` must support a completely different course without code edits.
- Image sources allow local paths, `https://`, and base64 raster `data:image/...`; reject insecure or executable protocols.
- Printing waits for images; an exported PDF contains the loaded image data and opens offline.
- No arbitrary HTML, scripts, expression templates, page-builder abstraction, new dependency, or remote non-image runtime content.
- Use TDD for every behavior change and preserve the RED/GREEN evidence in the review document.

---

## Planned File Responsibilities

- `docs/reviews/2026-07-14-json-driven-course-review.md`: findings, RED evidence, fixes, and final verification.
- `public/course.json`: Appendix A sample course and complete visible configuration.
- `fixtures/course-alt.json`: non-coffee replacement proof using the same schema.
- `public/sources.json`: source paths updated to match renamed/reordered sample slides.
- `src/course.ts`: types, validation, safe asset/action URL rules, theme mapping, and local-asset checks.
- `src/main.tsx`: JSON-driven renderers, CTA behavior, image readiness, and print output.
- `src/styles.css`: layout plus JSON-backed CSS variables for `/course` and `/print`.
- `tests/course.test.ts`: schema and protocol boundary tests.
- `tests/course-data.test.ts`: Appendix A order and branch path tests.
- `tests/course-alt.test.ts`: replacement theme and local-asset proof.
- `tests/rendering.test.tsx`: static rendered-output and print-image readiness proof.
- `README.md`, `docs/skills/Contract.md`, `DESIGN.md`, original spec/plan: living-document synchronization.

---

### Task 1: Record Findings and Lock Appendix A in a Failing Test

**Files:**
- Create: `docs/reviews/2026-07-14-json-driven-course-review.md`
- Modify: `tests/course-data.test.ts`
- Modify: `public/course.json`
- Modify: `public/sources.json`

**Interfaces:**
- Consumes: existing `validateCourse()` and the supplied exam document.
- Produces: the canonical IDs `cover`, `beans`, `caffeine`, `steps`, `quiz`, `basic`, `pro`, `extraction`, `summary` and two eight-page paths.

- [ ] **Step 1: Create the review document with pre-fix findings**

Record these open issues with source references: missing regional-bean content, caffeine/steps order reversal, hardcoded visible copy/colors, unused JSON fields, CTA href ignored, clickable ignored, incomplete print content, and absent remote-image print waiting. Add `RED evidence`, `Fixes`, and `GREEN evidence` sections with the explicit initial state `尚未执行（基线记录）`。

- [ ] **Step 2: Write the failing Appendix A test**

Replace the hardcoded path construction in `tests/course-data.test.ts` with assertions equivalent to:

```ts
const ids = course.slides.map((slide) => slide.id);
expect(ids).toEqual(['cover', 'beans', 'caffeine', 'steps', 'quiz', 'basic', 'pro', 'extraction', 'summary']);
expect(course.slides.find((slide) => slide.id === 'beans')).toMatchObject({
  type: 'content',
  title: '咖啡豆三大产区与风味'
});
for (const option of quiz.options) {
  expect(['cover', 'beans', 'caffeine', 'steps', 'quiz', option.goto, 'extraction', 'summary']).toHaveLength(8);
}
```

- [ ] **Step 3: Verify RED**

Run: `npm test -- --run tests/course-data.test.ts`

Expected: FAIL because current IDs/order contain `taste`, `steps`, `chart`.

- [ ] **Step 4: Apply the minimum sample-course correction**

Update `public/course.json` so `beans` contains the three regions and roast note, `caffeine` precedes `steps`, navigation targets use the new IDs, and optional `kicker`, `topics`, and quiz `description` hold the currently visible course-specific copy. Update `public/sources.json` paths from `slides.taste` / `slides.chart` to `slides.beans` / `slides.caffeine`.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run tests/course-data.test.ts`

Expected: 2 tests pass.

---

### Task 2: Extend and Secure the Shared JSON Contract

**Files:**
- Modify: `src/course.ts`
- Modify: `tests/course.test.ts`
- Modify: `public/course.json`
- Modify: `fixtures/course-alt.json`

**Interfaces:**
- Consumes: the corrected IDs from Task 1.
- Produces: `assetUrl(path: string): string`, `imageReferrerPolicy(path: string): 'no-referrer' | undefined`, `courseTheme(brand: Brand): ThemeStyle`, and validation for new schema fields.

- [ ] **Step 1: Write failing validation and helper tests**

Add tests equivalent to:

```ts
expect(assetUrl('https://img.example/a.jpg')).toBe('https://img.example/a.jpg');
expect(assetUrl('data:image/png;base64,AA==')).toBe('data:image/png;base64,AA==');
expect(assetUrl('assets/a.png')).toBe('/assets/a.png');
expect(imageReferrerPolicy('https://img.example/a.jpg')).toBe('no-referrer');

for (const bad of ['http://img.example/a.jpg', 'javascript:alert(1)', 'data:text/html,x']) {
  const input = structuredClone(valid);
  input.course.brand.logo = bad;
  expect(() => validateCourse(input)).toThrow(/course\.brand\.logo/);
}

for (const bad of ['javascript:alert(1)', 'http://example.com']) {
  const input = structuredClone(valid);
  input.slides.at(-1).action.href = bad;
  expect(() => validateCourse(input)).toThrow(/action\.href/);
}
```

Also assert `courseTheme()` maps alternate-course colors and never returns coffee color literals.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/course.test.ts tests/course-alt.test.ts`

Expected: FAIL because the helpers and validation do not exist.

- [ ] **Step 3: Implement minimal types and validation**

Extend types with:

```ts
export type Brand = {
  primary: string; accent: string; background: string; text: string; logo: string;
  surface?: string; muted?: string; line?: string; chartColors?: string[];
};
export type ThemeStyle = Record<`--${string}`, string>;
type BaseSlide = { id: string; type: string; title?: string; next?: string; kicker?: string };
export type CoverSlide = BaseSlide & { type: 'cover'; title: string; subtitle?: string; topics?: string[]; image?: string; imageAlt?: string };
export type QuizSlide = BaseSlide & {
  type: 'quiz'; question: string; description?: string;
  options: Array<{ id: string; text: string; goto: string; initialVotes?: number }>;
};
```

Add required UI fields `backToCourse`, `select`, `selected`, `results`, `peopleUnit`, and `imageLoadError`. Validate optional strings/arrays, `#RGB` / `#RRGGBB` colors, local/HTTPS/base64 raster image sources, and allowed CTA targets (local/relative paths, fragments, `https://`, `mailto:`, `tel:`).

Implement helpers without dependencies:

```ts
export const assetUrl = (path: string) => /^(https:\/\/|data:image\/(png|jpeg|webp|gif|avif);base64,|\/)/.test(path) ? path : `/${path}`;
export const imageReferrerPolicy = (path: string) => path.startsWith('https://') ? 'no-referrer' as const : undefined;
export const courseTheme = (brand: Brand) => ({
  '--primary': brand.primary,
  '--accent': brand.accent,
  '--canvas': brand.background,
  '--ink': brand.text,
  '--surface': brand.surface ?? brand.background,
  '--muted': brand.muted ?? brand.text,
  '--line': brand.line ?? brand.primary
});
```

- [ ] **Step 4: Update both JSON fixtures to the same contract**

Add the new UI labels to `public/course.json` and `fixtures/course-alt.json`. Give the alternate fixture clearly non-coffee labels and brand colors. Keep optional slide copy absent where it should render nothing.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run tests/course.test.ts tests/course-alt.test.ts`

Expected: all selected tests pass.

---

### Task 3: Make Course and Print Rendering JSON-Driven

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/styles.css`
- Create: `tests/rendering.test.tsx`

**Interfaces:**
- Consumes: `assetUrl`, `imageReferrerPolicy`, and `courseTheme` from Task 2.
- Produces: exported `SlideView`, `ChartView`, `QuizView`, and `PrintPage` components that can be verified with `renderToStaticMarkup()`.

- [ ] **Step 1: Write failing static-render tests**

Use `react-dom/server` with the alternate fixture. Assert:

```ts
const html = renderToStaticMarkup(<PrintPage course={altCourse} />);
expect(html).toContain(altCourse.course.title);
expect(html).toContain(altCourse.course.presenter);
expect(html).toContain(altCourse.course.brand.primary);
expect(html).toContain(altCourse.ui.exportPdf);
expect(html).toContain(altCourse.slides.at(-1).action.href);
expect(html).not.toMatch(/咖啡|冲煮|风味|变量观察|学习记录/);
```

Render the active chart and assert visible values include `mg`, configured labels appear, and a non-clickable chart renders disabled controls without an open detail panel.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/rendering.test.tsx`

Expected: FAIL because renderers are not exported and output still contains fixed course copy / lacks theme and CTA href.

- [ ] **Step 3: Apply JSON-driven rendering**

In `src/main.tsx`:

- import the shared helpers and remove the local `assetUrl`;
- apply `courseTheme(course.course.brand)` to `/course` and `/print` roots;
- render optional `slide.kicker`, `topics`, and quiz `description` only when configured;
- remove fixed course hints and decorative labels;
- show chart values with their configured unit;
- use `ui.next` normally and `ui.continue` after answering the quiz;
- use `ui.select`, `selected`, `results`, `peopleUnit`, `showDetail`, and `closeDetail`;
- honor `chart.clickable` and only show details after an actual selection;
- render CTA as an anchor using `action.href` while finishing the recorder on click;
- make `/print` include course title, presenter, logo, CTA label/href, all slides, and all details;
- guard the root mount with `if (typeof document !== 'undefined')` so render tests can import components.

- [ ] **Step 4: Replace course/print colors with variables**

Keep `/tools` fixed if convenient. Replace course/print color literals with `var(--primary)`, `var(--accent)`, `var(--canvas)`, `var(--ink)`, `var(--surface)`, `var(--muted)`, and `var(--line)`. Set each bar's `--bar-color` from `brand.chartColors` or `[primary, accent, text]` and use `background: var(--bar-color)`.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run tests/rendering.test.tsx tests/course-alt.test.ts`

Expected: all selected tests pass and rendered alternate output contains no coffee-course text.

---

### Task 4: Wait for Remote Images Before Printing

**Files:**
- Modify: `src/main.tsx`
- Modify: `tests/rendering.test.tsx`

**Interfaces:**
- Consumes: safe image sources and `ui.imageLoadError`.
- Produces: `waitForImages(images: HTMLImageElement[]): Promise<void>` and guarded print behavior.

- [ ] **Step 1: Write failing image-readiness tests**

Add fake image objects proving that `waitForImages()` awaits `decode()`, resolves for complete images with positive `naturalWidth`, and rejects with the failing `currentSrc` / `src` when `naturalWidth` is zero or an error event occurs.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/rendering.test.tsx`

Expected: FAIL because `waitForImages` is missing.

- [ ] **Step 3: Implement the minimal readiness helper and print handler**

Implement one promise per image: wait for `load`/`error` when incomplete, call `decode()` when available, and reject if `naturalWidth === 0`. In `PrintPage`, query only `.print-deck img`, await the helper, then call `window.print()`. On failure, render `${course.ui.imageLoadError}: ${source}` and do not print.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run tests/rendering.test.tsx`

Expected: all rendering tests pass.

---

### Task 5: Synchronize Living Documentation and Finish the Review

**Files:**
- Modify: `README.md`
- Modify: `docs/skills/Contract.md`
- Modify: `DESIGN.md`
- Modify: `docs/superpowers/specs/2026-07-14-coffee-course-engine-design.md`
- Modify: `docs/superpowers/plans/2026-07-14-coffee-course-engine.md`
- Modify: `docs/reviews/2026-07-14-json-driven-course-review.md`

**Interfaces:**
- Consumes: final behavior and RED/GREEN command output from Tasks 1–4.
- Produces: accurate replacement instructions, hard constraints, and an auditable review conclusion.

- [ ] **Step 1: Update required living documents**

Document the exact JSON fields, Appendix A order, CSS theme mapping, allowed image protocols, remote-image privacy/availability limitation, print waiting behavior, and literal JSON-only replacement using HTTPS or data images. Replace the old “no runtime remote content” wording with “no runtime remote content except configured HTTPS images.”

- [ ] **Step 2: Complete the review document**

For each pre-fix issue, record the fixing file/test and before/after effect. Replace `尚未执行（基线记录）` with the observed RED and GREEN command summaries. Do not claim browser/PDF manual inspection unless actually performed.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests pass, build exits 0, and diff check prints nothing.

- [ ] **Step 4: Check documentation consistency**

Run:

```bash
rg -n "只修改.*course\.json|HTTPS|data:image|附录 A|图片.*加载" README.md docs/skills/Contract.md DESIGN.md docs/superpowers docs/reviews
rg -n "no runtime remote content|不请求.*远程素材|运行时不请求.*远程" README.md docs/skills/Contract.md DESIGN.md docs/superpowers
```

Expected: the first command finds the new rules; the second finds no stale absolute prohibition unless explicitly qualified by the HTTPS-image exception.

---

### Task 6: Commit and Independent Code Review

**Files:**
- Review all changed files.

**Interfaces:**
- Consumes: verified implementation and documentation.
- Produces: a reviewable commit range and resolved independent-review findings.

- [ ] **Step 1: Commit the implementation**

Stage only files in this plan and commit with:

```bash
git commit -m "fix: make course presentation fully JSON-driven"
```

- [ ] **Step 2: Spawn the requested read-only reviewer subagent**

Provide the design spec, this plan, base SHA, head SHA, and exact instruction to inspect the diff without changing the worktree. Require Critical / Important / Minor findings with file-line references and a merge-readiness verdict.

- [ ] **Step 3: Resolve findings**

Fix every valid Critical and Important issue using a failing regression test first. Record rejected feedback with technical evidence. Re-run `npm test`, `npm run build`, and `git diff --check`, then amend or add a focused fix commit.

- [ ] **Step 4: Final verification**

Run fresh:

```bash
npm test
npm run build
git status --short
```

Expected: all tests and build pass; status contains no unintended files.
