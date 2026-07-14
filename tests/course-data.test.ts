import { describe, expect, it } from 'vitest';
import courseJson from '../public/course.json';
import { validateCourse } from '../src/course';

describe('active course data', () => {
  it('validates the nine definitions and two charts', () => {
    const course = validateCourse(courseJson);
    expect(course.slides).toHaveLength(9);
    expect(course.slides.filter((slide) => slide.type === 'chart')).toHaveLength(2);
  });

  it('keeps each answer path at eight teaching pages', () => {
    const course = validateCourse(courseJson);
    const quiz = course.slides.find((slide) => slide.id === 'quiz');
    if (!quiz || quiz.type !== 'quiz') throw new Error('quiz missing');
    for (const option of quiz.options) {
      const visited = ['cover', 'taste', 'steps', 'chart', 'quiz', option.goto, 'extraction', 'summary'];
      expect(new Set(visited).size).toBe(8);
    }
  });
});
