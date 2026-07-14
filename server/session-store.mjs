import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const safeId = (value) => typeof value === 'string' && /^[a-f0-9-]{8,}$/i.test(value);
const fileFor = (dir, sessionId) => {
  if (!safeId(sessionId)) throw new Error('invalid session id');
  return join(dir, `${sessionId}.json`);
};

const atomicWrite = async (file, value) => {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temp, file);
};

export async function createSession(courseId, directory = 'records') {
  await mkdir(directory, { recursive: true });
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const record = { sessionId, courseId, status: 'in_progress', startedAt: now, updatedAt: now, totalActiveMs: 0, slideSegments: [], featureEvents: [], answers: [] };
  await atomicWrite(fileFor(directory, sessionId), record);
  return record;
}

export async function appendSessionEvent(sessionId, event, directory = 'records') {
  const file = fileFor(directory, sessionId);
  const record = JSON.parse(await readFile(file, 'utf8'));
  const timestamp = new Date().toISOString();
  if (event?.type === 'slide_segment') {
    const durationMs = Number.isFinite(event.durationMs) ? Math.max(0, event.durationMs) : 0;
    record.slideSegments.push({ slideId: event.slideId, durationMs, timestamp });
    record.totalActiveMs += durationMs;
  } else if (event?.type === 'feature') {
    record.featureEvents.push({ name: event.name, timestamp });
  } else if (event?.type === 'answer') {
    record.answers.push({ slideId: event.slideId, optionId: event.optionId, timestamp });
  } else if (event?.type === 'status' && ['completed', 'abandoned'].includes(event.status)) {
    record.status = event.status;
  }
  record.updatedAt = timestamp;
  await atomicWrite(file, record);
  return record;
}
