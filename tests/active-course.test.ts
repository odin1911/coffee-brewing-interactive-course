import { describe, expect, it } from 'vitest';
import packageJson from '../package.json';
import activeCourse from '../public/course.json';
import { validateCourse } from '../src/course';

describe('active course validation', () => {
  it('validates public/course.json', () => {
    expect(() => validateCourse(activeCourse)).not.toThrow();
  });

  it('runs before every production build', () => {
    const scripts = packageJson.scripts as Record<string, string>;
    expect(scripts['validate:course']).toBe('vitest run tests/active-course.test.ts');
    expect(scripts.build).toMatch(/^npm run validate:course && /);
  });
});
