import { describe, expect, it } from 'vitest';
import { assetUrl, courseTheme, CourseConfigError, findMissingAssets, imageReferrerPolicy, validateCourse } from '../src/course';

const valid: any = {
  course: {
    id: 'demo', version: '1', title: 'Demo', presenter: 'P',
    brand: { primary: '#4A2C1A', accent: '#D89A4E', background: '#F7F0E5', text: '#2B211B', logo: 'assets/logo.svg' }
  },
  ui: {
    navigation: 'Course navigation', previous: 'Prev', next: 'Next', continue: 'Continue', showDetail: 'Show',
    closeDetail: 'Close', exportPdf: 'PDF', openTools: 'Tools', recordStatus: 'Record', restartCourse: 'Restart', validationResult: 'Validation',
    backToCourse: 'Back', select: 'Select', selected: 'Selected', results: 'Results', peopleUnit: 'people', imageLoadError: 'Image failed'
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

  it('maps safe asset addresses and brand colors', () => {
    expect(assetUrl('assets/a.png')).toBe('/assets/a.png');
    expect(assetUrl('https://img.example/a.jpg')).toBe('https://img.example/a.jpg');
    expect(assetUrl('data:image/png;base64,AA==')).toBe('data:image/png;base64,AA==');
    expect(imageReferrerPolicy('https://img.example/a.jpg')).toBe('no-referrer');
    expect(courseTheme(valid.course.brand)).toMatchObject({ '--primary': '#4A2C1A', '--accent': '#D89A4E' });
  });

  it('handles uppercase HTTPS images consistently after validation', async () => {
    const input = structuredClone(valid);
    input.course.brand.logo = 'HTTPS://img.example/a.jpg';
    const course = validateCourse(input);
    let requested = false;

    const missing = await findMissingAssets(course, async () => {
      requested = true;
      return new Response(null, { status: 404 });
    });

    expect(imageReferrerPolicy(course.course.brand.logo)).toBe('no-referrer');
    expect(missing).toEqual([]);
    expect(requested).toBe(false);
  });

  it('rejects unsafe image addresses', () => {
    for (const logo of ['http://img.example/a.jpg', 'javascript:alert(1)', ' javascript:alert(1)', 'https://', 'data:text/html,x', '\\\\evil.example/a.png']) {
      const input = structuredClone(valid);
      input.course.brand.logo = logo;
      expect(() => validateCourse(input)).toThrow(/course\.brand\.logo/);
    }
  });

  it('rejects unsafe CTA addresses', () => {
    for (const href of ['javascript:alert(1)', ' javascript:alert(1)', 'http://example.com', 'https://', '\\\\evil.example/course']) {
      const input = structuredClone(valid);
      input.slides.at(-1).action.href = href;
      expect(() => validateCourse(input)).toThrow(/action\.href/);
    }
  });

  it('rejects invalid theme and optional visible copy', () => {
    const color = structuredClone(valid);
    color.course.brand.primary = 'coffee';
    expect(() => validateCourse(color)).toThrow(/course\.brand\.primary/);

    const copy = structuredClone(valid);
    copy.slides[0].kicker = '';
    copy.slides[0].topics = ['Valid', ''];
    expect(() => validateCourse(copy)).toThrow(/slides\.0/);
  });

  it('rejects brand colors that violate normal-text contrast', () => {
    const input = structuredClone(valid);
    input.course.brand.primary = '#FFFFFF';
    input.course.brand.background = '#FFFFFF';

    expect(() => validateCourse(input)).toThrow(/course\.brand contrast/);
  });

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

  it('rejects chart detail ids inherited from the object prototype', () => {
    const input = structuredClone(valid);
    input.slides.splice(1, 0, {
      id: 'chart', type: 'chart', title: 'Chart',
      chart: { kind: 'bar', unit: 'mg', clickable: true, series: [{ label: 'A', value: 1, detail: 'toString' }] }
    });

    expect(() => validateCourse(input)).toThrow(/unknown detail: toString/);
  });

  it('rejects empty charts and invalid chart values', () => {
    const empty = structuredClone(valid);
    empty.slides.splice(1, 0, { id: 'chart', type: 'chart', title: 'Chart', chart: { kind: 'bar', unit: 'mg', clickable: true, series: [] } });
    expect(() => validateCourse(empty)).toThrow(/slides\.1 chart is invalid/);

    const negative = structuredClone(valid);
    negative.details.value = { title: 'Value', facts: ['Fact'] };
    negative.slides.splice(1, 0, { id: 'chart', type: 'chart', title: 'Chart', chart: { kind: 'bar', unit: 'mg', clickable: true, series: [{ label: 'A', value: -1, detail: 'value' }] } });
    expect(() => validateCourse(negative)).toThrow(/slides\.1 chart item is invalid/);
  });

  it('returns every validation error', () => {
    expect(() => validateCourse({ slides: [] })).toThrow(CourseConfigError);
    try { validateCourse({ slides: [] }); } catch (error) {
      expect((error as CourseConfigError).errors.length).toBeGreaterThan(1);
    }
  });
});
