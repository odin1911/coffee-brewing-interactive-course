# Family Safety Course Swap Implementation Plan

Status: completed for comparison; the active course was subsequently restored to the preserved coffee JSON.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active coffee course with the family safety course, preserve the exact coffee JSON, and produce a verified before/after comparison without changing runtime code.

**Architecture:** Keep the engine untouched. Move coffee-specific acceptance inputs to a dedicated fixture, make `public/course.json` a functional family safety course based on the existing alternate fixture, and keep sample-specific tests bound to their fixtures instead of the active runtime file.

**Tech Stack:** JSON, TypeScript, React static rendering, Vitest, Vite.

## Global Constraints

- Work directly on `main`; do not create a worktree or dispatch subagents.
- Do not modify any file under `src/`.
- Preserve the pre-swap `public/course.json` byte-for-byte as `fixtures/course-coffee.json`.
- The active family safety course omits the alternate fixture's intentionally missing optional cover image so the page and PDF remain usable.
- Keep Appendix A coffee assertions against the preserved coffee fixture.

---

### Task 1: Establish the active-course replacement check

**Files:**
- Modify: `tests/course-alt.test.ts`
- Test: `tests/course-alt.test.ts`

**Interfaces:**
- Consumes: `validateCourse(input)` and `public/course.json`.
- Produces: a regression check that the active runtime course is `weather-safety-101` and contains no configured missing cover image.

- [ ] **Step 1: Write the failing test**

Add the active import and test:

```ts
import activeJson from '../public/course.json';

it('uses the family safety course as the active runtime JSON', () => {
  const course = validateCourse(activeJson);
  expect(course.course.id).toBe('weather-safety-101');
  expect(course.slides[0]).not.toHaveProperty('image');
});
```

- [ ] **Step 2: Run the focused test and observe RED**

Run: `npm test -- --run tests/course-alt.test.ts`

Expected: FAIL because the active course id is still `coffee-brewing-101`.

---

### Task 2: Preserve coffee data and replace the active JSON

**Files:**
- Create: `fixtures/course-coffee.json`
- Modify: `public/course.json`
- Modify: `tests/course-data.test.ts`
- Modify: `tests/rendering.test.tsx`
- Test: `tests/course-data.test.ts`, `tests/course-alt.test.ts`, `tests/rendering.test.tsx`

**Interfaces:**
- Consumes: the exact pre-swap JSON and the approved `fixtures/course-alt.json` content.
- Produces: `fixtures/course-coffee.json` for Appendix A checks and a family safety `public/course.json` for runtime loading.

- [ ] **Step 1: Preserve the current JSON exactly**

Create `fixtures/course-coffee.json` with the complete current contents of `public/course.json` before changing the active file.

- [ ] **Step 2: Decouple coffee-specific tests from the active course**

In `tests/course-data.test.ts` replace:

```ts
import courseJson from '../public/course.json';
```

with:

```ts
import courseJson from '../fixtures/course-coffee.json';
```

In `tests/rendering.test.tsx` replace the coffee import:

```ts
import courseJson from '../public/course.json';
```

with:

```ts
import coffeeJson from '../fixtures/course-coffee.json';
```

and validate `coffeeJson` as `coffeeCourse`.

- [ ] **Step 3: Replace the active course**

Set `public/course.json` to the family safety configuration from `fixtures/course-alt.json`, omitting only `slides[0].image` and `slides[0].imageAlt` because the referenced file is intentionally absent.

- [ ] **Step 4: Run focused tests and observe GREEN**

Run:

```bash
npm test -- --run tests/course-data.test.ts tests/course-alt.test.ts tests/rendering.test.tsx
```

Expected: 3 test files pass; the active course test reports `weather-safety-101`, while Appendix A coffee and chart tests continue to pass against the preserved fixture.

---

### Task 3: Synchronize audit documents and verify the comparison

**Files:**
- Modify: `public/sources.json`
- Modify: `README.md`
- Modify: `docs/skills/Contract.md`
- Modify: `docs/superpowers/specs/2026-07-14-course-swap-comparison-design.md`
- Create: `docs/reviews/2026-07-14-course-swap-comparison.md`

**Interfaces:**
- Consumes: the final active and preserved JSON files.
- Produces: accurate source attribution, project constraints, and a durable before/after comparison.

- [ ] **Step 1: Update source attribution**

Replace coffee-specific `public/sources.json` entries with AI-generated family safety entries covering `course`, `ui`, both slides, and `assets/logo.svg`.

- [ ] **Step 2: Synchronize live documentation**

State in `README.md` and `docs/skills/Contract.md` that the active demonstration is “家庭防灾入门”, while `fixtures/course-coffee.json` preserves the Appendix A reference course. Update the approved design to record omission of the intentionally missing optional image.

- [ ] **Step 3: Write the comparison report**

Create `docs/reviews/2026-07-14-course-swap-comparison.md` with exact before/after metadata, theme colors, slide counts/types, UI examples, detail counts, changed runtime-code count, and validation commands.

- [ ] **Step 4: Run final verification**

Run:

```bash
npm test
npm run build
git diff --check
git diff --name-only HEAD -- src
```

Expected: all tests pass, build succeeds, whitespace check is clean, and the final command prints nothing.

- [ ] **Step 5: Commit**

```bash
git add fixtures/course-coffee.json public/course.json public/sources.json tests/course-data.test.ts tests/course-alt.test.ts tests/rendering.test.tsx README.md docs/skills/Contract.md docs/superpowers/specs/2026-07-14-course-swap-comparison-design.md docs/superpowers/plans/2026-07-14-course-swap-comparison.md docs/reviews/2026-07-14-course-swap-comparison.md
git commit -m "feat: switch active course to family safety"
```
