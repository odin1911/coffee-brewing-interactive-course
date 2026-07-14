import { describe, expect, it } from 'vitest';
import altCourse from '../fixtures/course-alt.json';
import activeJson from '../public/course.json';
import { courseTheme, findMissingAssets, validateCourse } from '../src/course';

describe('course replacement proof', () => {
  it('uses the family safety course as the active runtime JSON', () => {
    const course = validateCourse(activeJson);
    expect(course.course.id).toBe('weather-safety-101');
    expect(course.slides[0]).not.toHaveProperty('image');
  });

  it('validates a non-coffee course without code changes', () => {
    const course = validateCourse(altCourse);
    expect(course.course.id).toBe('weather-safety-101');
    expect(courseTheme(course.course.brand)).toMatchObject({
      '--primary': '#17324D', '--accent': '#D78B3C', '--canvas': '#EEF4F7', '--ink': '#17212B'
    });
  });

  it('returns missing asset paths for the tools error experience', async () => {
    const course = validateCourse(altCourse);
    const missing = await findMissingAssets(course, async (path) => ({ ok: String(path).endsWith('logo.svg') } as Response));
    expect(missing).toContain('/assets/missing-weather.png');
  });
});
