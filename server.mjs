import express from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendSessionEvent, createSession } from './server/session-store.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 4173);
const recordsDir = join(root, 'records');

app.use(express.json({ limit: '32kb' }));
app.post('/api/sessions', async (request, response) => {
  if (typeof request.body?.courseId !== 'string' || request.body.courseId.trim() === '') return response.status(400).json({ error: 'courseId is required' });
  try { return response.status(201).json(await createSession(request.body.courseId, recordsDir)); } catch { return response.status(500).json({ error: 'could not create session' }); }
});
app.patch('/api/sessions/:sessionId', async (request, response) => {
  if (!request.body?.event || typeof request.body.event !== 'object') return response.status(400).json({ error: 'event is required' });
  try { return response.json(await appendSessionEvent(request.params.sessionId, request.body.event, recordsDir)); } catch (error) { return response.status(400).json({ error: error instanceof Error ? error.message : 'could not update session' }); }
});

app.use(express.static(join(root, 'dist')));
app.use((request, response, next) => {
  if (request.method !== 'GET') return next();
  return response.sendFile(join(root, 'dist', 'index.html'));
});

app.listen(port, () => console.log(`Coffee course server listening on http://localhost:${port}`));
