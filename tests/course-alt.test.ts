import { describe, expect, it } from 'vitest';
import altCourse from '../fixtures/course-alt.json';
import { findMissingAssets, validateCourse } from '../src/course';

describe('course replacement proof', () => {
  it('validates a non-coffee course without code changes', () => {
    expect(validateCourse(altCourse).course.id).toBe('weather-safety-101');
  });

  it('returns missing asset paths for the tools error experience', async () => {
    const course = validateCourse(altCourse);
    const missing = await findMissingAssets(course, async (path) => ({ ok: String(path).endsWith('logo.svg') } as Response));
    expect(missing).toContain('/assets/missing-weather.png');
  });
});
