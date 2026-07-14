import { describe, expect, it } from 'vitest';
import type { CourseConfig } from '../src/course';
import { createCourseReducer, createInitialState } from '../src/session';

const course = {
  course: { id: 'x', version: '1', title: 'X', presenter: 'P', brand: { primary: '#1', accent: '#2', background: '#3', text: '#4', logo: 'x' } },
  ui: { navigation: 'nav', previous: 'p', next: 'n', continue: 'c', showDetail: 's', closeDetail: 'x', exportPdf: 'e', openTools: 't', recordStatus: 'r', restartCourse: 'z', validationResult: 'v' },
  details: { d1: { title: 'D1', facts: [] } },
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
