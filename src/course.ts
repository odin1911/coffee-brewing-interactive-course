export type Brand = { primary: string; accent: string; background: string; text: string; logo: string };
export type UiCopy = {
  navigation: string; previous: string; next: string; continue: string; showDetail: string; closeDetail: string;
  exportPdf: string; openTools: string; recordStatus: string; restartCourse: string; validationResult: string;
};
type BaseSlide = { id: string; type: string; title?: string; next?: string };
export type CoverSlide = BaseSlide & { type: 'cover'; title: string; subtitle?: string; image?: string; imageAlt?: string };
export type ContentSlide = BaseSlide & { type: 'content'; title: string; bullets: string[]; image?: string; imageAlt?: string };
export type ChartSlide = BaseSlide & {
  type: 'chart'; title: string;
  chart: { kind: 'bar'; unit: string; clickable: boolean; series: Array<{ label: string; value: number; detail: string }> };
};
export type QuizSlide = BaseSlide & {
  type: 'quiz'; question: string;
  options: Array<{ id: string; text: string; goto: string; initialVotes?: number }>;
};
export type CtaSlide = BaseSlide & { type: 'cta'; title: string; body: string; action: { label: string; href: string } };
export type Slide = CoverSlide | ContentSlide | ChartSlide | QuizSlide | CtaSlide;
export type Detail = { title: string; facts: string[] };
export type CourseConfig = {
  course: { id: string; version: string; title: string; presenter: string; brand: Brand };
  ui: UiCopy;
  slides: Slide[];
  details: Record<string, Detail>;
};

export class CourseConfigError extends Error {
  constructor(public errors: string[]) {
    super(errors.join('\n'));
    this.name = 'CourseConfigError';
  }
}

const record = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function validateCourse(input: unknown): CourseConfig {
  const errors: string[] = [];
  if (!record(input)) throw new CourseConfigError(['root must be an object']);
  const { course, ui, slides, details } = input;

  if (!record(course)) errors.push('course must be an object');
  else {
    for (const key of ['id', 'version', 'title', 'presenter']) if (!text(course[key])) errors.push(`course.${key} must be text`);
    if (!record(course.brand)) errors.push('course.brand must be an object');
    else for (const key of ['primary', 'accent', 'background', 'text', 'logo']) if (!text(course.brand[key])) errors.push(`course.brand.${key} must be text`);
  }

  const uiKeys = ['navigation', 'previous', 'next', 'continue', 'showDetail', 'closeDetail', 'exportPdf', 'openTools', 'recordStatus', 'restartCourse', 'validationResult'];
  if (!record(ui)) errors.push('ui must be an object');
  else for (const key of uiKeys) if (!text(ui[key])) errors.push(`ui.${key} must be text`);

  if (!record(details)) errors.push('details must be an object');
  else for (const [id, value] of Object.entries(details)) {
    if (!record(value) || !text(value.title) || !Array.isArray(value.facts) || !value.facts.every(text)) errors.push(`details.${id} is invalid`);
  }

  if (!Array.isArray(slides) || slides.length === 0) errors.push('slides must be a non-empty array');
  else {
    const ids = new Set<string>();
    for (const [index, raw] of slides.entries()) {
      if (!record(raw) || !text(raw.id) || !text(raw.type)) { errors.push(`slides.${index} requires id and type`); continue; }
      if (ids.has(raw.id)) errors.push(`duplicate slide id: ${raw.id}`);
      ids.add(raw.id);
      if (raw.next !== undefined && !text(raw.next)) errors.push(`slides.${index}.next must be text`);
      if (raw.type === 'cover' && !text(raw.title)) errors.push(`slides.${index}.title must be text`);
      else if (raw.type === 'content' && (!text(raw.title) || !Array.isArray(raw.bullets) || !raw.bullets.every(text))) errors.push(`slides.${index} content is invalid`);
      else if (raw.type === 'chart') {
        if (!text(raw.title) || !record(raw.chart) || raw.chart.kind !== 'bar' || !text(raw.chart.unit) || !Array.isArray(raw.chart.series)) errors.push(`slides.${index} chart is invalid`);
        else for (const item of raw.chart.series) if (!record(item) || !text(item.label) || typeof item.value !== 'number' || !text(item.detail)) errors.push(`slides.${index} chart item is invalid`);
      } else if (raw.type === 'quiz') {
        if (!text(raw.question) || !Array.isArray(raw.options) || raw.options.length < 2) errors.push(`slides.${index} quiz is invalid`);
        else for (const option of raw.options) if (!record(option) || !text(option.id) || !text(option.text) || !text(option.goto)) errors.push(`slides.${index} quiz option is invalid`);
      } else if (raw.type === 'cta' && (!text(raw.title) || !text(raw.body) || !record(raw.action) || !text(raw.action.label) || !text(raw.action.href))) errors.push(`slides.${index} cta is invalid`);
      else if (!['cover', 'content', 'chart', 'quiz', 'cta'].includes(raw.type)) errors.push(`slides.${index} unknown type: ${raw.type}`);
    }
    for (const raw of slides) if (record(raw)) {
      if (text(raw.next) && !ids.has(raw.next)) errors.push(`unknown next: ${raw.next}`);
      if (raw.type === 'quiz' && Array.isArray(raw.options)) for (const option of raw.options) if (record(option) && text(option.goto) && !ids.has(option.goto)) errors.push(`unknown goto: ${option.goto}`);
      if (raw.type === 'chart' && record(raw.chart) && Array.isArray(raw.chart.series)) for (const item of raw.chart.series) if (record(item) && text(item.detail) && (!record(details) || !(item.detail in details))) errors.push(`unknown detail: ${item.detail}`);
    }
  }

  if (errors.length) throw new CourseConfigError(errors);
  return input as CourseConfig;
}

export async function loadCourse(url = '/course.json'): Promise<CourseConfig> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new CourseConfigError([`failed to load ${url}: ${response.status}`]);
  return validateCourse(await response.json());
}

export async function findMissingAssets(course: CourseConfig, fetcher: typeof fetch = fetch): Promise<string[]> {
  const paths = new Set<string>([course.course.brand.logo]);
  for (const slide of course.slides) if ((slide.type === 'cover' || slide.type === 'content') && slide.image) paths.add(slide.image);
  const missing: string[] = [];
  for (const path of paths) {
    const url = path.startsWith('/') ? path : `/${path}`;
    try { if (!(await fetcher(url, { method: 'HEAD' })).ok) missing.push(url); } catch { missing.push(url); }
  }
  return missing;
}
