# Presenter Vote Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace preloaded quiz percentages with presenter-operated live counters whose unique leader controls the branch.

**Architecture:** Keep counts in the existing reducer as `slideId -> optionId -> count`. Derive the unique winner in `src/session.ts`, render repeated increment/decrement controls in the existing `QuizView`, and keep all course-facing labels in JSON. No backend voting system or new dependency.

**Tech Stack:** React 19, TypeScript, Vitest, CSS.

## Global Constraints

- Every option starts at zero; counts never become negative.
- Zero votes or a tie produces no next slide; a unique leader's `goto` controls the branch.
- Remove `initialVotes` from runtime types, validation, examples, and current JSON.
- Reuse `ui.select` for “add one vote” and `ui.selected` for the leader label; subtraction uses the visible `−1` symbol plus option text for its accessible name.
- Do not add audience devices, network synchronization, a voting backend, or dependencies.
- Do not use worktrees or subagents.

---

### Task 1: Vote state and branch selection

**Files:**
- Modify: `tests/session.test.ts`
- Modify: `src/session.ts`

**Interfaces:**
- Produces: `VoteCounts`, `getWinningOptionId(slide, votes)`, and reducer action `{ type: 'VOTE'; slideId; optionId; delta: 1 | -1 }`.
- Consumes: existing `QuizSlide.options[].goto`.

- [ ] **Step 1: Write failing reducer tests**

Cover repeated increments, decrement clamping, no-vote blocking, tie blocking, unique-leader branching, and changing the leader after returning.

```ts
state = reduce(state, { type: 'VOTE', slideId: 'quiz', optionId: 'a', delta: 1 });
state = reduce(state, { type: 'VOTE', slideId: 'quiz', optionId: 'a', delta: 1 });
expect(getNextSlideId(course, state)).toBe('basic');
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/session.test.ts`
Expected: FAIL because `VOTE`, vote state, and winner derivation do not exist.

- [ ] **Step 3: Implement the minimum reducer model**

```ts
export type VoteCounts = Record<string, number>;

export function getWinningOptionId(slide: QuizSlide, votes: VoteCounts = {}): string | null {
  const max = Math.max(0, ...slide.options.map((option) => votes[option.id] ?? 0));
  if (max === 0) return null;
  const leaders = slide.options.filter((option) => (votes[option.id] ?? 0) === max);
  return leaders.length === 1 ? leaders[0].id : null;
}
```

Update `getNextSlideId` to resolve the winner, and clamp decrement results with `Math.max(0, current + delta)`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/session.test.ts`
Expected: all session tests pass.

### Task 2: Presenter counter UI and final answer recording

**Files:**
- Modify: `tests/rendering.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `VoteCounts`, `getWinningOptionId`, reducer `VOTE` action, and existing `SessionRecorder.answer`.
- Produces: repeatable add and subtract controls, live counts/percentages, and leader styling.

- [ ] **Step 1: Write a failing rendering test**

Render `QuizView` with `{ basic: 2, pro: 1 }`; assert `2 人`, `67%`, JSON-backed add/leader labels, and a subtract button. Assert zero counts render `0%` rather than preset values.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/rendering.test.tsx`
Expected: FAIL because `QuizView` accepts a single selected answer and reads `initialVotes`.

- [ ] **Step 3: Implement the minimum UI**

Pass the current slide's counts into `SlideView` and `QuizView`. Clicking a choice dispatches `VOTE +1`; its adjacent `−1` button dispatches `VOTE -1`. Calculate total and percentages solely from state. Use the existing selected style for the unique leader. On quiz continuation, record only the final winning option before dispatching `NEXT`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/rendering.test.tsx tests/recorder.test.ts`
Expected: all listed tests pass.

### Task 3: Remove preset votes and synchronize living documentation

**Files:**
- Modify: `src/course.ts`
- Modify: `tests/course.test.ts`
- Modify: `tests/course-data.test.ts`
- Modify: `public/course.json`
- Modify: `fixtures/course-coffee.json`
- Modify: `fixtures/course-alt.json`
- Modify: `README.md`
- Modify: `docs/skills/Contract.md`
- Modify: `docs/superpowers/specs/2026-07-14-coffee-course-engine-design.md`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: quiz JSON containing only `id`, `text`, and `goto`; updated meanings for `ui.select` and `ui.selected`.

- [ ] **Step 1: Write the failing data assertion**

```ts
expect(quiz.options.every((option) => !Object.hasOwn(option, 'initialVotes'))).toBe(true);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/course-data.test.ts`
Expected: FAIL because the coffee fixture still contains preset votes.

- [ ] **Step 3: Remove preset-vote behavior and update docs**

Delete `initialVotes` from `QuizSlide`, validator logic, active JSON, coffee fixture, and its obsolete validation test. Change JSON labels to counting/leader wording. Document presenter counting, tie blocking, and unique-leader branching in README, Contract, the engine design, and DESIGN.

- [ ] **Step 4: Run full verification**

Run: `npm run validate:course && npm test && npm run build && git diff --check`
Expected: validation succeeds, all tests pass, production build succeeds, and diff check is clean.
