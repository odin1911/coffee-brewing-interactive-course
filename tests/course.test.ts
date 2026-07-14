import { describe, expect, it } from 'vitest';
import { CourseConfigError, validateCourse } from '../src/course';

const valid: any = {
  course: {
    id: 'demo', version: '1', title: 'Demo', presenter: 'P',
    brand: { primary: '#4A2C1A', accent: '#D89A4E', background: '#F7F0E5', text: '#2B211B', logo: 'assets/logo.svg' }
  },
  ui: {
    navigation: 'Course navigation', previous: 'Prev', next: 'Next', continue: 'Continue', showDetail: 'Show',
    closeDetail: 'Close', exportPdf: 'PDF', openTools: 'Tools', recordStatus: 'Record', restartCourse: 'Restart', validationResult: 'Validation'
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
