export type Brand = {
  primary: string; accent: string; background: string; text: string; logo: string;
  surface?: string; muted?: string; line?: string; chartColors?: string[];
};
export type ThemeStyle = Record<`--${string}`, string>;
export type UiCopy = {
  navigation: string; previous: string; next: string; continue: string; showDetail: string; closeDetail: string;
  exportPdf: string; openTools: string; recordStatus: string; restartCourse: string; validationResult: string;
  backToCourse: string; select: string; selected: string; results: string; peopleUnit: string; imageLoadError: string;
};
type BaseSlide = { id: string; type: string; title?: string; next?: string; kicker?: string };
export type CoverSlide = BaseSlide & { type: 'cover'; title: string; subtitle?: string; topics?: string[]; image?: string; imageAlt?: string };
export type ContentSlide = BaseSlide & { type: 'content'; title: string; bullets: string[]; image?: string; imageAlt?: string };
export type ChartSlide = BaseSlide & {
  type: 'chart'; title: string;
  chart: { kind: 'bar'; unit: string; clickable: boolean; series: Array<{ label: string; value: number; detail: string }> };
};
export type QuizSlide = BaseSlide & {
  type: 'quiz'; question: string; description?: string;
  options: Array<{ id: string; text: string; goto: string }>;
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
const color = (value: unknown): value is string => typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
const colorChannels = (value: string) => {
  const hex = value.slice(1);
  const expanded = hex.length === 3 ? [...hex].map((part) => part + part).join('') : hex;
  return [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255);
};
const luminance = (value: string) => colorChannels(value)
  .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const contrastRatio = (first: string, second: string) => {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};
const dataImage = (value: string) => /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(value);
const cleanAddress = (value: string) => value === value.trim();
const localAddress = (value: string) => cleanAddress(value) && !value.includes('\\') && !value.startsWith('//') && !/^[a-z][a-z\d+.-]*:/i.test(value);
const httpsAddress = (value: string) => {
  if (!cleanAddress(value)) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname); } catch { return false; }
};
const imageAddress = (value: unknown): value is string => text(value) && (localAddress(value) || httpsAddress(value) || (cleanAddress(value) && dataImage(value)));
const actionAddress = (value: unknown): value is string => text(value) && (localAddress(value) || httpsAddress(value) || (cleanAddress(value) && /^(?:mailto:|tel:)/i.test(value)));

export const assetUrl = (path: string) => /^(?:https:\/\/|data:image\/|\/)/i.test(path) ? path : `/${path}`;
export const imageReferrerPolicy = (path: string) => httpsAddress(path) ? 'no-referrer' as const : undefined;
export const courseTheme = (brand: Brand): ThemeStyle => ({
  '--primary': brand.primary,
  '--accent': brand.accent,
  '--focus': brand.text,
  '--canvas': brand.background,
  '--ink': brand.text,
  '--surface': brand.surface ?? brand.background,
  '--muted': brand.muted ?? brand.text,
  '--line': brand.line ?? brand.primary
});

export function validateCourse(input: unknown): CourseConfig {
  const errors: string[] = [];
  if (!record(input)) throw new CourseConfigError(['root must be an object']);
  const { course, ui, slides, details } = input;

  if (!record(course)) errors.push('course must be an object');
  else {
    for (const key of ['id', 'version', 'title', 'presenter']) if (!text(course[key])) errors.push(`course.${key} must be text`);
    if (!record(course.brand)) errors.push('course.brand must be an object');
    else {
      for (const key of ['primary', 'accent', 'background', 'text']) if (!color(course.brand[key])) errors.push(`course.brand.${key} must be a hex color`);
      if (!imageAddress(course.brand.logo)) errors.push('course.brand.logo must be a local, HTTPS, or raster data image');
      for (const key of ['surface', 'muted', 'line']) if (course.brand[key] !== undefined && !color(course.brand[key])) errors.push(`course.brand.${key} must be a hex color`);
      if (course.brand.chartColors !== undefined && (!Array.isArray(course.brand.chartColors) || course.brand.chartColors.length === 0 || !course.brand.chartColors.every(color))) errors.push('course.brand.chartColors must be non-empty hex colors');
      if (color(course.brand.primary) && color(course.brand.background) && color(course.brand.text)
        && (course.brand.surface === undefined || color(course.brand.surface))
        && (course.brand.muted === undefined || color(course.brand.muted))) {
        const surface = course.brand.surface ?? course.brand.background;
        const muted = course.brand.muted ?? course.brand.text;
        const pairs = [
          ['text/background', course.brand.text, course.brand.background],
          ['text/surface', course.brand.text, surface],
          ['primary/background', course.brand.primary, course.brand.background],
          ['primary/surface', course.brand.primary, surface],
          ['muted/background', muted, course.brand.background],
          ['muted/surface', muted, surface]
        ] as const;
        for (const [name, foreground, background] of pairs) if (contrastRatio(foreground, background) < 4.5) errors.push(`course.brand contrast ${name} must be at least 4.5:1`);
      }
    }
  }

  const uiKeys = ['navigation', 'previous', 'next', 'continue', 'showDetail', 'closeDetail', 'exportPdf', 'openTools', 'recordStatus', 'restartCourse', 'validationResult', 'backToCourse', 'select', 'selected', 'results', 'peopleUnit', 'imageLoadError'];
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
      if (raw.kicker !== undefined && !text(raw.kicker)) errors.push(`slides.${index}.kicker must be text`);
      if (raw.type === 'cover') {
        if (!text(raw.title) || (raw.subtitle !== undefined && !text(raw.subtitle)) || (raw.topics !== undefined && (!Array.isArray(raw.topics) || !raw.topics.every(text))) || (raw.image !== undefined && !imageAddress(raw.image)) || (raw.imageAlt !== undefined && !text(raw.imageAlt))) errors.push(`slides.${index} cover is invalid`);
      } else if (raw.type === 'content' && (!text(raw.title) || !Array.isArray(raw.bullets) || !raw.bullets.every(text) || (raw.image !== undefined && !imageAddress(raw.image)) || (raw.imageAlt !== undefined && !text(raw.imageAlt)))) errors.push(`slides.${index} content is invalid`);
      else if (raw.type === 'chart') {
        if (!text(raw.title) || !record(raw.chart) || raw.chart.kind !== 'bar' || !text(raw.chart.unit) || typeof raw.chart.clickable !== 'boolean' || !Array.isArray(raw.chart.series) || raw.chart.series.length === 0) errors.push(`slides.${index} chart is invalid`);
        else for (const item of raw.chart.series) if (!record(item) || !text(item.label) || typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value < 0 || !text(item.detail)) errors.push(`slides.${index} chart item is invalid`);
      } else if (raw.type === 'quiz') {
        if (!text(raw.question) || (raw.description !== undefined && !text(raw.description)) || !Array.isArray(raw.options) || raw.options.length < 2) errors.push(`slides.${index} quiz is invalid`);
        else for (const option of raw.options) if (!record(option) || !text(option.id) || !text(option.text) || !text(option.goto)) errors.push(`slides.${index} quiz option is invalid`);
      } else if (raw.type === 'cta' && (!text(raw.title) || !text(raw.body) || !record(raw.action) || !text(raw.action.label) || !actionAddress(raw.action.href))) errors.push(`slides.${index} action.href is invalid`);
      else if (!['cover', 'content', 'chart', 'quiz', 'cta'].includes(raw.type)) errors.push(`slides.${index} unknown type: ${raw.type}`);
    }
    for (const raw of slides) if (record(raw)) {
      if (text(raw.next) && !ids.has(raw.next)) errors.push(`unknown next: ${raw.next}`);
      if (raw.type === 'quiz' && Array.isArray(raw.options)) for (const option of raw.options) if (record(option) && text(option.goto) && !ids.has(option.goto)) errors.push(`unknown goto: ${option.goto}`);
      if (raw.type === 'chart' && record(raw.chart) && Array.isArray(raw.chart.series)) for (const item of raw.chart.series) if (record(item) && text(item.detail) && (!record(details) || !Object.hasOwn(details, item.detail))) errors.push(`unknown detail: ${item.detail}`);
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
    if (httpsAddress(path) || dataImage(path)) continue;
    const url = assetUrl(path);
    try { if (!(await fetcher(url, { method: 'HEAD' })).ok) missing.push(url); } catch { missing.push(url); }
  }
  return missing;
}
