import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendSessionEvent, createSession } from '../server/session-store.mjs';

describe('session store', () => {
  it('creates one file and atomically updates it for each event', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'coffee-session-'));
    const record = await createSession('coffee', dir);
    await appendSessionEvent(record.sessionId, { type: 'slide_segment', slideId: 'cover', durationMs: 1200 }, dir);
    const files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
    const saved = JSON.parse(await readFile(join(dir, files[0]), 'utf8'));
    expect(files).toHaveLength(1);
    expect(saved.slideSegments[0]).toMatchObject({ slideId: 'cover', durationMs: 1200 });
  });

  it('rejects unsafe session ids', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'coffee-session-'));
    await expect(appendSessionEvent('../escape', { type: 'feature', name: 'x' }, dir)).rejects.toThrow(/invalid session id/);
  });
});
