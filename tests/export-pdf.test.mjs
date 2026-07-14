import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chromeArguments, hasPdfHeader, output } from '../scripts/export-pdf.mjs';

describe('PDF export helpers', () => {
  it('uses a course-neutral output filename', () => {
    expect(basename(output)).toBe('course.pdf');
  });

  it('builds headless Chrome print arguments', () => {
    expect(chromeArguments('/tmp/course.pdf', 'http://127.0.0.1:4173/print')).toContain('--print-to-pdf=/tmp/course.pdf');
  });

  it('recognizes a PDF file header', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'coffee-pdf-'));
    const file = join(directory, 'course.pdf');
    await writeFile(file, '%PDF-1.7');
    expect(await hasPdfHeader(file)).toBe(true);
    await rm(directory, { recursive: true });
  });
});
