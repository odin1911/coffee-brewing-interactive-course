# Shared Course and Print Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/course` and every main `/print` page use the same slide canvas and teaching components, with chart details moved to automatic continuation pages.

**Architecture:** Extract the existing stage/rail/body markup into `SlideCanvas`. `CoursePage` supplies live handlers and navigation; `PrintPage` renders every JSON slide through the same `SlideView` in static mode, then inserts chart-detail continuation pages in groups of three. Print-only CSS controls preview sizing and physical pagination without redefining the teaching layout.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, headless Chrome PDF export.

## Global Constraints

- Do not change `course.json`, reducer, recording API, server, or export filename.
- Main print pages must reuse the same cover, content, chart, quiz, and CTA render path as `/course`.
- Print hides navigation and live controls; quiz print pages never invent vote results.
- Print includes all nine slide definitions and two chart-detail continuation pages for the current course.
- Each detail continuation page contains at most three detail cards.
- No new dependency, worktree, or subagent.

---

### Task 1: Shared slide canvas and static slide rendering

**Files:**
- Modify: `tests/rendering.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `SlideCanvas({ pageNumber, headingId, className?, slideId?, children })`.
- Extends: `SlideView` with `mode?: 'course' | 'print'` and `headingId?: string`.
- Consumes: existing `Slide`, `CourseConfig`, `ChartView`, and `QuizView`.

- [x] **Step 1: Write the failing shared-structure test**

Assert that `PrintPage` contains nine elements marked `data-slide-id`, the cover main page contains `cover-grid`, the obsolete `print-brand` structure is absent, and print output contains no live vote result text.

```tsx
const html = renderToStaticMarkup(<PrintPage course={coffeeCourse} />);
expect(html.match(/data-slide-id=/g)).toHaveLength(9);
expect(html).toContain('class="cover-grid"');
expect(html).not.toContain('class="print-brand"');
expect(html).not.toContain('现场计票');
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/rendering.test.tsx`
Expected: FAIL because the print page still builds separate markup and has no shared slide markers.

- [x] **Step 3: Implement the shared canvas**

Create `SlideCanvas` from the existing `.stage`, `.rail`, and `.slide-body` markup. Use it in `CoursePage` and `PrintPage`. Pass unique print heading IDs such as `slide-title-cover` to avoid duplicate DOM IDs.

In print mode:

- cover and content reuse their existing render branches unchanged;
- chart renders the same chart with interaction disabled and no open detail;
- quiz renders question and option cards without add/subtract controls or result percentages;
- CTA renders its configured action label inside the slide because course navigation is absent.

- [x] **Step 4: Verify GREEN**

Run: `npm test -- tests/rendering.test.tsx`
Expected: all rendering tests pass.

### Task 2: Chart detail continuation pages

**Files:**
- Modify: `tests/rendering.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `ChartDetailPage({ course, slide, pageNumber, items })`.
- Consumes: chart `series[]` order and `course.details[item.detail]`.

- [x] **Step 1: Write the failing pagination test**

Assert that coffee print output has eleven `.print-slide` pages, exactly two `.chart-detail-page` pages, labels `03A` and `08A`, and every detail title/fact appears.

```tsx
expect(html.match(/class="[^"]*print-slide/g)).toHaveLength(11);
expect(html.match(/chart-detail-page/g)).toHaveLength(2);
expect(html).toContain('03A');
expect(html).toContain('08A');
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/rendering.test.tsx`
Expected: FAIL because continuation pages do not exist.

- [x] **Step 3: Implement fixed-size detail grouping**

For every chart slide, split `series[]` into groups of three with a small loop. Insert each group immediately after its chart main page. Render the original chart title and the referenced detail cards inside a `SlideCanvas` marked `chart-detail-page`; label groups with `A`, `B`, and so on.

- [x] **Step 4: Verify GREEN**

Run: `npm test -- tests/rendering.test.tsx`
Expected: all rendering tests pass with eleven print pages.

### Task 3: Print sizing, documentation, and exported PDF

**Files:**
- Modify: `src/print.css`
- Modify: `README.md`
- Modify: `DESIGN.md`
- Modify: `docs/skills/Contract.md`
- Modify: `docs/superpowers/specs/2026-07-14-coffee-course-engine-design.md`
- Test: `tests/rendering.test.tsx`

**Interfaces:**
- Consumes: shared `.stage`, `.slide-body`, `.print-slide`, and `.chart-detail-page` classes.
- Preserves: `npm run export:pdf` output at `exports/course.pdf`.

- [x] **Step 1: Add the print layout contract test**

Read `src/print.css` and assert that print slides retain `aspect-ratio:16/9` in preview, occupy one physical page under `@media print`, and hide `.print-toolbar`.

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/rendering.test.tsx`
Expected: FAIL because `print.css` currently contains only the page-size declaration.

- [x] **Step 3: Add minimum print-only CSS and synchronize living docs**

Override preview width/height, physical page breaks, toolbar visibility, and the three-card detail grid. Because Chromium evaluates the responsive breakpoint against its narrow print viewport, explicitly restore the desktop grid and sizing values after the shared mobile rules. Keep colors and slide content styles inherited from the shared course classes. Update documentation to state that the current PDF has nine main pages plus two detail continuation pages.

- [x] **Step 4: Run full verification**

Run: `npm run validate:course && npm test && npm run build && git diff --check`
Expected: validation, all tests, production build, and whitespace checks pass.

- [x] **Step 5: Export and inspect the PDF**

Run: `npm run export:pdf`
Expected: `exports/course.pdf` is valid, contains eleven 16:9 pages, and embeds the cover image for offline use.
